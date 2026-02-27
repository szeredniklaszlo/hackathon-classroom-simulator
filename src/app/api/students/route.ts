import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase.  Using env variables in a real app, 
// but for the hackathon/simplicity we use the project URL and anon key here.
// In a production app, these should be in .env.local:
// process.env.NEXT_PUBLIC_SUPABASE_URL
// process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jababoyjtxydkmzcvitj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYmFib3lqdHh5ZGttemN2aXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjU0MjEsImV4cCI6MjA4Nzc0MTQyMX0.7oBzsoy6NgbFZ2zkJOoQFIICH1JzOE9QZJgKLcMEDxk';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, age, emoji, personality, activity_level, conflict_level, attention_span, type } = body;

        // Basic Validation
        if (!name || type === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (age < 6 || age > 18) {
            return NextResponse.json({ error: 'Age must be between 6 and 18' }, { status: 400 });
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
                    type
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
