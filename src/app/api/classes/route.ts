import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, subject, emoji, description, students } = body;

        // Basic Validation
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('virtual_classes')
            .insert([
                {
                    name,
                    subject: subject || null,
                    emoji: emoji || '📚',
                    description: description || null,
                    students: students || []
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ virtualClass: data }, { status: 201 });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('virtual_classes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ classes: data }, { status: 200 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
