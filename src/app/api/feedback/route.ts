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
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        // Format transcript for the prompt
        let formattedTranscript = "";
        transcript.forEach((entry: TranscriptEntry) => {
            formattedTranscript += `[${entry.timestamp}] ${entry.speaker}: ${entry.text} ${entry.emotion ? '(Emotion: ' + entry.emotion + ')' : ''}\n`;
        });

        const prompt = `Te egy oktatásszakértő és tréner vagy (AI Coach), aki pedagógusoknak ad visszajelzést a szimulált óráikon nyújtott teljesítményükről.
Kérlek, elemezd az alábbi tanár-diák(ok) beszélgetést, és adj részletes angol vagy magyar (ahogy a beszélgetés nyelve is volt) visszajelzést 3 fő kategóriában.
Kifejezetten a pedagógus kommunikációjára, osztálytermi menedzsmentjére, kérdezéstechnikájára, és diákok bevonására fókuszálj.

Válaszolj KIZÁRÓLAG egy érvényes JSON objektummal, ami a következő formátumot követi (ne használj markdown blokkokat \`\`\`json, csak a nyers JSON-t add vissza!):
{
  "wentWell": [
    "Első pozitívum megfogalmazva",
    "Második pozitívum megfogalmazva"
  ],
  "toImprove": [
    "Első fejlesztendő terület",
    "Második fejlesztendő terület"
  ],
  "suggestions": [
    "Első konkrét gyakorlati jó tanács",
    "Második jó tanács"
  ]
}

Az átirat:
${formattedTranscript}`;

        const result = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a JSON-returning AI Coach." },
                { role: "user", content: prompt }
            ]
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
