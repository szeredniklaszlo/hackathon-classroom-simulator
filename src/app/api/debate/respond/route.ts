import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

export async function POST(req: Request) {
    try {
        const { topic, userStance, aiStance, transcript } = await req.json();

        if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
            return NextResponse.json({ error: 'Azure OpenAI credentials missing' }, { status: 500 });
        }

        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        // Construct the messages history
        const messages = [
            {
                role: 'system',
                content: `You are an elite, pedagogical AI Debate Coach.
Your goal is to debate the user on the topic: "${topic}".
The user's stance is: ${userStance.toUpperCase()}.
Your stance is strictly: ${aiStance.toUpperCase()}.

You must output your response in STRICT JSON format with two keys:
1. "critique": A short, 1-2 sentence real-time analysis of the user's *LAST* argument. Point out logical fallacies (e.g., ad hominem, strawman, hasty generalization), highlight strong rhetoric, or suggest a stronger angle. Be constructive but rigorous.
2. "reply": Your actual spoken counter-argument. Keep it concise (2-4 sentences max), punchy, and directly challenge the user's points while advancing your stance.

Example Output:
{
  "critique": "You relied on a slippery slope fallacy here. Try focusing on immediate, proven consequences rather than extreme hypothetical outcomes.",
  "reply": "While that's a dramatic prediction, there is no empirical evidence to suggest such an extreme outcome. Instead, we see that..."
}

DO NOT output markdown blockings (\`\`\`json). Output raw JSON only.`
            },
        ];

        // Add history
        for (const turn of transcript) {
            messages.push({
                role: turn.speaker === 'user' ? 'user' : 'assistant',
                content: turn.text
            });
        }

        const response = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
            messages: messages as any,
            temperature: 0.7,
            max_tokens: 800,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from AI");

        const parsedContent = JSON.parse(content);

        return NextResponse.json({
            reply: parsedContent.reply,
            critique: parsedContent.critique
        }, { status: 200 });

    } catch (error: any) {
        console.error("Debate Respond Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
