import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

interface TranscriptEntry {
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
    emotion?: string;
}

export async function POST(request: Request) {
    try {
        const { transcript } = await request.json();

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json(
                {
                    feedback: {
                        wentWell: ["Nincs elérhető beszélgetés az értékeléshez."],
                        toImprove: ["Kérjük indítson egy órát a visszajelzéshez."],
                        suggestions: ["Aktív beszélgetés esetén itt jelennek meg a tippek."]
                    }
                },
                { status: 200 }
            );
        }

        const client = new AzureOpenAI({
            endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
            apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        // Format transcript for the prompt
        let formattedTranscript = "";
        transcript.forEach((entry: TranscriptEntry) => {
            if (entry.speaker !== '__snapshot__') {
                formattedTranscript += `[${entry.timestamp}] ${entry.speaker}: ${entry.text} ${entry.emotion ? '(Emotion: ' + entry.emotion + ')' : ''}\n`;
            }
        });

        const prompt = `You are an educational expert and AI Coach providing feedback to teachers on their performance in a simulated classroom.
Please analyze the following teacher-student(s) conversation and provide detailed feedback IN ENGLISH across 3 main categories.
Focus specifically on the teacher's communication, classroom management, questioning techniques, and student engagement.

Respond ONLY with a valid JSON object matching the format below (no markdown blocks, just raw JSON):
{
  "wentWell": [
    "First positive observation",
    "Second positive observation"
  ],
  "toImprove": [
    "First area for improvement",
    "Second area for improvement"
  ],
  "suggestions": [
    "First practical suggestion",
    "Second practical suggestion"
  ]
}

The transcript:
\${formattedTranscript}`;

        const result = await client.chat.completions.create({
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || "",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a JSON-returning AI Coach." },
                { role: "user", content: prompt }
            ],
            temperature: 1.3,
        });

        const content = result.choices[0]?.message?.content;
        if (!content) throw new Error("Failed to generate feedback");

        const parsedFeedback = JSON.parse(content);

        return NextResponse.json({ feedback: parsedFeedback }, { status: 200 });
    } catch (error: any) {
        console.error("Feedback Generation Error:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate feedback' },
            { status: 500 }
        );
    }
}
