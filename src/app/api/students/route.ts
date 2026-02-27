import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase.  Using env variables in a real app, 
// but for the hackathon/simplicity we use the project URL and anon key here.
// In a production app, these should be in .env.local:
// process.env.NEXT_PUBLIC_SUPABASE_URL
// process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, age, emoji, personality, activity_level, conflict_level, attention_span, type, condition } = body;

        // Basic Validation
        if (!name || type === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (age < 6 || age > 18) {
            return NextResponse.json({ error: 'Age must be between 6 and 18' }, { status: 400 });
        }

        let generatedPrompt = '';
        if (process.env.OPENAI_API_KEY) {
            try {
                const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert prompt engineer. Based on the provided student details, write an English prompt that can be given to an AI so that the AI behaves exactly like this student in a classroom simulator. Only output the generated prompt, nothing else.'
                            },
                            {
                                role: 'user',
                                content: `Student details:\nName: ${name}\nAge: ${age}\nType: ${type}\nCondition/Disability: ${condition || 'None'}\nPersonality: ${personality}\nActivity Level: ${activity_level}\nConflict Level: ${conflict_level}\nAttention Span: ${attention_span}`
                            }
                        ],
                        temperature: 0.7,
                    })
                });

                if (openAiResponse.ok) {
                    const aiData = await openAiResponse.json();
                    generatedPrompt = aiData.choices?.[0]?.message?.content?.trim() || '';
                } else {
                    console.error("OpenAI API Error:", await openAiResponse.text());
                }
            } catch (aiError) {
                console.error("Failed to generate prompt:", aiError);
            }
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('student_personas')
            .insert([
                {
                    name,
                    age,
                    emoji,
                    personality,
                    activity_level,
                    conflict_level,
                    attention_span,
                    type,
                    condition: condition || null,
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

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('student_personas')
            .select('id, name, age, emoji, type, prompt, condition, personality, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ students: data }, { status: 200 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
