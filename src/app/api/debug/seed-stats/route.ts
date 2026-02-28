import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback to anon key if service role is missing, though RLS might block it.
// To bypass RLS and insert mock data correctly, service role is preferred.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "No userId provided for seeding." }, { status: 400 });
        }

        // Fetch user's virtual classes to get class IDs and students
        const { data: classes, error: classesError } = await supabase
            .from('virtual_classes')
            .select('*');

        if (classesError) throw classesError;
        if (!classes || classes.length === 0) {
            return NextResponse.json({ message: "No classes found to seed data for." }, { status: 200 });
        }

        const insertedSessions = [];
        const insertedStudentStats = [];
        const insertedEvents = [];

        for (const vClass of classes) {
            // Generate 1-3 sessions per class
            const numSessions = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numSessions; i++) {
                // Random duration between 15 and 60 minutes
                const durationSeconds = Math.floor(Math.random() * (60 * 60 - 15 * 60 + 1)) + 15 * 60;

                // Random past start time (within last 7 days)
                const daysAgo = Math.floor(Math.random() * 7);
                const startedAt = new Date();
                startedAt.setDate(startedAt.getDate() - daysAgo);
                startedAt.setHours(Math.floor(Math.random() * 8) + 8); // 8 AM to 4 PM
                startedAt.setMinutes(Math.floor(Math.random() * 60));

                const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

                const sessionAvgSatisfaction = Math.floor(Math.random() * 40) + 60; // 60-100

                // 1. Insert Class Session
                const { data: sessionData, error: sessionError } = await supabase
                    .from('class_sessions')
                    .insert({
                        class_id: vClass.id,
                        user_id: userId,
                        started_at: startedAt.toISOString(),
                        ended_at: endedAt.toISOString(),
                        duration_seconds: durationSeconds,
                        average_satisfaction: sessionAvgSatisfaction
                    })
                    .select('id')
                    .single();

                if (sessionError) throw sessionError;
                const sessionId = sessionData.id;
                insertedSessions.push(sessionId);

                // Students parsing (stored as JSONB)
                let students = [];
                try {
                    students = typeof vClass.students === 'string' ? JSON.parse(vClass.students) : vClass.students;
                } catch (e) {
                    students = [];
                }

                if (!Array.isArray(students)) students = [];

                // Process Stats & Events for each student
                for (const student of students) {
                    const studentAvgSatisfaction = Math.max(0, Math.min(100, sessionAvgSatisfaction + (Math.floor(Math.random() * 30) - 15)));

                    // 2. Insert Student Session Stats
                    const { data: statData, error: statError } = await supabase
                        .from('student_session_stats')
                        .insert({
                            session_id: sessionId,
                            student_id: student.id || `mock-${Math.random()}`,
                            student_name: student.name || 'Unknown Student',
                            average_satisfaction: studentAvgSatisfaction
                        })
                        .select('id')
                        .single();

                    if (statError) throw statError;
                    insertedStudentStats.push(statData.id);

                    // 3. Insert Satisfaction Events (timeline mapping)
                    const numEvents = Math.floor(durationSeconds / 60); // Roughly 1 event per minute
                    let currentScore = studentAvgSatisfaction;

                    const eventsToInsert = [];
                    for (let j = 0; j < numEvents; j++) {
                        // Fluctuate score slightly per minute
                        const fluctuation = Math.floor(Math.random() * 11) - 5; // -5 to +5
                        currentScore = Math.max(0, Math.min(100, currentScore + fluctuation));

                        const eventTime = new Date(startedAt.getTime() + (j * 60 * 1000));

                        eventsToInsert.push({
                            session_id: sessionId,
                            student_id: student.id || `mock-${Math.random()}`,
                            mood_score: currentScore,
                            recorded_at: eventTime.toISOString()
                        });
                    }

                    if (eventsToInsert.length > 0) {
                        const { error: eventsError } = await supabase
                            .from('satisfaction_events')
                            .insert(eventsToInsert);

                        if (eventsError) throw eventsError;
                        insertedEvents.push(...eventsToInsert);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${insertedSessions.length} sessions, ${insertedStudentStats.length} student stats, and ${insertedEvents.length} distinct mood events.`
        });

    } catch (error: any) {
        console.error("Seeding Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
