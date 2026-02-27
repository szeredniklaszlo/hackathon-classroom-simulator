import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

// Mapping diverse personality traits to distinct OpenAI voices
const voiceMap: Record<string, string> = {
    'Fast Learner': 'alloy',
    'ESL Student': 'echo',
    'Easily Distracted': 'fable',
    'Deep Thinker': 'onyx',
    'Anxious Achiever': 'nova',
    'Class Clown': 'shimmer',
};

export async function POST(req: NextRequest) {
    try {
        const { text, studentType } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            // Default to tts-1 deployment unless specified
            deployment: process.env.AZURE_OPENAI_TTS_DEPLOYMENT_NAME || 'tts-1',
        });

        // Determine voice based on student type
        // @ts-ignore
        const voice = voiceMap[studentType] || 'alloy';

        const response = await client.audio.speech.create({
            model: "tts-1",
            voice: voice,
            input: text,
            response_format: "mp3",
        });

        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('Error generating TTS:', error);
        return NextResponse.json(
            { error: 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
