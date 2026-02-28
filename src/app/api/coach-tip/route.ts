import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

interface CoachTipRequest {
    avgEngagement: number;
    confusedStudents: { name: string; score: number }[];
    recentTranscript: string; // last few lines as a string
    sessionDurationSeconds: number;
}

export async function POST(request: Request) {
    try {
        const body: CoachTipRequest = await request.json();
        const { avgEngagement, confusedStudents, recentTranscript, sessionDurationSeconds } = body;

        const client = new AzureOpenAI({
            endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
            apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        const confusedList = confusedStudents.length > 0
            ? confusedStudents.map(s => `${s.name} (${s.score}%)`).join(', ')
            : 'None';

        const prompt = `You are a real-time AI coaching assistant embedded in a virtual classroom simulator.
A teacher is currently running a live lesson. Analyze the current classroom state and give ONE short, actionable coaching tip.

Current State:
- Session duration: ${Math.floor(sessionDurationSeconds / 60)}m ${sessionDurationSeconds % 60}s
- Average class engagement: ${avgEngagement}%
- Students showing low engagement (<40%): ${confusedList}
- Recent conversation (last few exchanges):
${recentTranscript || '(No transcript yet)'}

Rules:
- Give EXACTLY ONE tip, max 2 sentences.
- Be specific, practical, and encouraging.
- Address the most pressing issue (e.g., low engagement, specific struggling students).
- Do NOT use bullet points or headers. Just plain text.
- Respond ONLY with the tip text, nothing else.`;

        const result = await client.chat.completions.create({
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || '',
            messages: [
                { role: 'system', content: 'You are a concise AI teaching coach. Respond with only your tip, no preamble.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 100,
        });

        const tip = result.choices[0]?.message?.content?.trim() || 'Keep engaging your students with questions!';

        return NextResponse.json({ tip }, { status: 200 });
    } catch (error: any) {
        console.error('Coach tip error:', error);
        // Graceful fallback — never break the classroom for a coach tip failure
        return NextResponse.json({
            tip: 'Try asking a specific student a direct question to boost engagement.'
        }, { status: 200 });
    }
}
