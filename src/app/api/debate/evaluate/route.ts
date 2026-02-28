import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

export async function POST(req: Request) {
  try {
    const { topic, userStance, transcript } = await req.json();

    if (!process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || !process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT) {
      return NextResponse.json({ error: 'Azure OpenAI credentials missing' }, { status: 500 });
    }

    const client = new AzureOpenAI({
      endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
      apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
      deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME,
    });

    // Construct history string for the prompt
    const historyText = transcript.map((t: any) => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n\n');

    const prompt = `You are an expert Debate Adjudicator.
Review the following debate transcript on the topic: "${topic}".
The USER argued ${userStance.toUpperCase()}.

Evaluate the USER's performance. You must output your evaluation in STRICT JSON format matching this structure exactly:
{
  "argumentStrength": <number 0-100 indicating logical soundness and persuasiveness>,
  "vocabularyScore": <number 0-100 indicating quality and variety of phrasing>,
  "fallaciesSpotted": [
    {
      "name": "<Name of fallacy, e.g., Ad Hominem>",
      "description": "<Why it was committed and where>"
    }
  ],
  "overallFeedback": "<A 2-3 sentence summary of the user's performance>",
  "improvementTips": [
    "<Actionable tip 1>",
    "<Actionable tip 2>"
  ]
}

Transcript:
${historyText}

Output strictly raw JSON without markdown formatting.`;

    const response = await client.chat.completions.create({
      model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || '',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const parsedContent = JSON.parse(content);
    return NextResponse.json(parsedContent, { status: 200 });

  } catch (error: any) {
    console.error("Debate Evaluate Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
