import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface GeneratedPersona {
    name: string;
    age: number;
    condition: string[];
    personality: string;
    activityLevel: number;
    conflictLevel: number;
    attentionSpan: number;
    type: string;
}

export async function POST() {
    try {
        const client = new AzureOpenAI({
            endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
            apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
            deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        const randomSeed = Math.random().toString(36).substring(7);
        const prompt = `You are an expert educational psychologist designing a student persona for a virtual classroom simulator.
Generate a realistic, completely random student persona. It should be an English speaking student.
Random seed for diversity: ${randomSeed}.

Respond ONLY with a valid JSON object matching this schema:
{
  "name": "FirstName LastName",
  "age": 12, // number between 6 and 18
  "condition": ["ADHD", "Anxiety"], // an array of string conditions in English, or [] if none
  "personality": "A brief description of their personality, learning style, and typical classroom behavior.",
  "activityLevel": 65, // number 0-100 indicating how active/vocal they are
  "conflictLevel": 30, // number 0-100 indicating how prone they are to causing disruptions
  "attentionSpan": 45, // number 0-100 indicating their ability to focus
  "type": "average" // string, one of: "achiever", "troublemaker", "quiet", "average", "clown"
}`;

        const result = await client.chat.completions.create({
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || "",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: prompt }
            ],
            temperature: 1.3,
            presence_penalty: 1.0,
        });

        const content = result.choices[0]?.message?.content;
        if (!content) throw new Error("Failed to generate persona");

        const parsedData: GeneratedPersona = JSON.parse(content);
        const joinedConditions = parsedData.condition.length > 0 ? parsedData.condition.join(', ') : null;

        // Generate the system prompt for the persona (using openai direct here like the other route, or just azure)
        // Since we already have Azure Open AI initialized, it's faster to just use it.
        const systemPromptResult = await client.chat.completions.create({
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || "",
            messages: [
                { role: 'system', content: 'You are an expert prompt engineer. Based on the provided student details, write an English prompt that can be given to an AI so that the AI behaves exactly like this student in a classroom simulator. Only output the generated prompt, nothing else.' },
                { role: 'user', content: `Student details:\nName: ${parsedData.name}\nAge: ${parsedData.age}\nType: ${parsedData.type}\nCondition/Disability: ${joinedConditions || 'None'}\nPersonality: ${parsedData.personality}\nActivity Level: ${parsedData.activityLevel}\nConflict Level: ${parsedData.conflictLevel}\nAttention Span: ${parsedData.attentionSpan}` }
            ],
            temperature: 1.3,
        });

        const generatedPrompt = systemPromptResult.choices[0]?.message?.content?.trim() || '';

        // Insert into Supabase
        const { data, error } = await supabase
            .from('student_personas')
            .insert([
                {
                    name: parsedData.name,
                    age: parsedData.age,
                    personality: parsedData.personality,
                    activity_level: parsedData.activityLevel,
                    conflict_level: parsedData.conflictLevel,
                    attention_span: parsedData.attentionSpan,
                    type: parsedData.type,
                    condition: joinedConditions,
                    prompt: generatedPrompt || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ student: data }, { status: 201 });
    } catch (error: any) {
        console.error("AI Generation and Save failed:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate persona' }, { status: 500 });
    }
}
