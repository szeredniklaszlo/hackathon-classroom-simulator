import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureOpenAI } from 'openai';

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
        if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
            try {
                const client = new AzureOpenAI({
                    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                    apiKey: process.env.AZURE_OPENAI_API_KEY,
                    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
                });

                const openAiResponse = await client.chat.completions.create({
                    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
                    messages: [
                        {
                            role: 'system',
                            content: `Te egy nagyon profi Prompt Engineer vagy, aki AI alapú oktatási szimulátorhoz készít rendkívül részletes "System Prompt"-ot. 
Készítsd el a tanuló system promptját EGY/ELSŐ SZEMÉLYBE ("You are..."). 
A prompt tartalmazza:
- Milyen a tanuló háttérsztorija, személyisége és viselkedése a tanórán.
- Hogyan reagál kérdésekre, hogyan kommunikál.
- Milyen speciális betegségei vannak, azok hogyan jelennek meg (pl. figyelemzavar).
- Mit tesz, ha unatkozik, ha dicséri a tanár, ha felszólítják de nem tudja.
A válaszodban CSAK ÉS KIZÁRÓLAG az elkészített teljes angol nyelvű system prompt szerepeljen, semmi más.`
                        },
                        {
                            role: 'user',
                            content: `Student details:
Name: ${name}
Age: ${age}
Type/Role: ${type}
Condition/Disability: ${condition || 'None'}
Personality: ${personality}
Activity Level (0-100): ${activity_level}
Conflict Level (0-100): ${conflict_level}
Attention Span (0-100): ${attention_span}

Please generate the detailed persona system prompt in English.`
                        }
                    ],
                    //temperature: 0.8,
                });

                generatedPrompt = openAiResponse.choices?.[0]?.message?.content?.trim() || '';
                console.log("Sikeresen generálva a prompt:", generatedPrompt.substring(0, 50) + "...");
            } catch (aiError) {
                console.error("Failed to generate prompt via Azure OpenAI:", aiError);
            }
        } else {
            console.warn("Nincs beállítva az AZURE_OPENAI_API_KEY vagy ENDPOINT a környezeti változókban!");
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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('q');

        let query = supabase
            .from('student_personas')
            .select('id, name, age, emoji, type, prompt, condition, personality, created_at')
            .order('created_at', { ascending: false });

        if (searchQuery) {
            // ILIKE matches case-insensitively. we check both name and condition.
            query = query.or(`name.ilike.%${searchQuery}%,condition.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

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
