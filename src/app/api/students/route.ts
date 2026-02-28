import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureOpenAI } from 'openai';

// Simple heuristic to guess gender from name (Hungarian/English focus)
const guessGender = (fullName: string): 'boy' | 'girl' => {
    if (!fullName) return 'boy';
    const firstName = fullName.split(' ')[0].toLowerCase();
    // Common girl name endings
    if (firstName.endsWith('a') || firstName.endsWith('e') || firstName.endsWith('i') || firstName.endsWith('y')) {
        return 'girl';
    }
    return 'boy';
};

const getAvatarUrl = (name: string, age: number) => {
    const gender = guessGender(name);
    // Use the user's specific requested format: avatar.iran.liara.run proxied through wsrv.nl
    return `https://wsrv.nl/?url=${encodeURIComponent(`avatar.iran.liara.run/public/${gender}?username=` + name + '_' + age)}`;
};

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
                    prompt: generatedPrompt || null,
                    avatar_url: getAvatarUrl(name, age)
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

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, name, age, emoji, personality, activity_level, conflict_level, attention_span, type, condition } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
        }

        // Fetch current student to check if we need to regenerate prompt
        const { data: currentStudent, error: fetchError } = await supabase
            .from('student_personas')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentStudent) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Determine if we should regenerate the AI prompt
        // We regenerate if name, age, type, condition, or personality-defining levels change
        const shouldRegenerate =
            attention_span !== currentStudent.attention_span ||
            condition !== currentStudent.condition;

        // Regenerate avatar if name or age changes
        let avatar_url = currentStudent.avatar_url;
        if (name !== currentStudent.name || age !== currentStudent.age || !avatar_url) {
            avatar_url = getAvatarUrl(name, age);
        }

        let updatedPrompt = currentStudent.prompt;

        if (shouldRegenerate && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
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
                            content: `Student details (UPDATED):
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
                });

                updatedPrompt = openAiResponse.choices?.[0]?.message?.content?.trim() || updatedPrompt;
            } catch (aiError) {
                console.error("Failed to re-generate prompt via Azure OpenAI:", aiError);
            }
        }

        // Update in Supabase
        const { data, error } = await supabase
            .from('student_personas')
            .update({
                name,
                age,
                emoji,
                personality,
                activity_level,
                conflict_level,
                attention_span,
                type,
                condition: condition || null,
                prompt: updatedPrompt,
                avatar_url: avatar_url
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ student: data }, { status: 200 });

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
            .select('id, name, age, emoji, type, prompt, condition, personality, avatar_url, created_at')
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
