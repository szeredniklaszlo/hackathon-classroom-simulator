import { NextRequest, NextResponse } from 'next/server';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// Mapping diverse personality traits to distinct Microsoft Cognitive Services voices
// We can use Hungarian neural voices as requested
const voiceMap: Record<string, string> = {
    'Fast Learner': "en-IN-AnanyaNeural",
    'ESL Student': "en-IN-AnanyaNeural",
    'Easily Distracted': "en-IN-AnanyaNeural",
    'Deep Thinker': "en-IN-AnanyaNeural",
    'Anxious Achiever': "en-IN-AnanyaNeural",
    'Class Clown': "en-IN-AnanyaNeural",
};

export async function POST(req: NextRequest) {
    try {
        const { text, studentType } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const voice = voiceMap[studentType] || "en-IN-AnanyaNeural";

        const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
        const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            console.warn("NEXT_PUBLIC_AZURE_SPEECH_KEY or NEXT_PUBLIC_AZURE_SPEECH_REGION is not set.");
            return NextResponse.json({ error: 'Azure Speech credentials are not configured' }, { status: 500 });
        }

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisVoiceName = voice;
        // Output as mp3
        speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        // Use null for audioConfig to ensure it doesn't play on the server's speaker
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null as any);

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            synthesizer.speakTextAsync(
                text,
                result => {
                    if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                        resolve(result.audioData);
                    } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
                        const cancellation = SpeechSDK.CancellationDetails.fromResult(result);
                        reject(new Error(`Synthesis canceled: ${cancellation.errorDetails}`));
                    } else {
                        reject(new Error(`Synthesis failed. Reason: ${result.reason}`));
                    }
                    synthesizer.close();
                },
                err => {
                    reject(new Error(err));
                    synthesizer.close();
                }
            );
        });

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('Error generating TTS:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
