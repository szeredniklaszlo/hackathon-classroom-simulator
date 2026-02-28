import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
        return NextResponse.json({ error: 'classId parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();

    try {
        // 1. Fetch the LATEST session for this class
        const { data: latestSession, error: sessionError } = await supabase
            .from('class_sessions')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
            throw sessionError;
        }

        if (!latestSession) {
            return NextResponse.json({
                durationSeconds: 0,
                timeline: [],
                studentStats: []
            }, { status: 200 });
        }

        const sessionId = latestSession.id;

        // 2. Fetch specific student stats for this session
        const { data: studentStats, error: statsError } = await supabase
            .from('student_session_stats')
            .select('*')
            .eq('session_id', sessionId)
            .order('average_satisfaction', { ascending: false });

        if (statsError) throw statsError;

        // 3. Fetch satisfaction timeline events
        const { data: events, error: eventsError } = await supabase
            .from('satisfaction_events')
            .select('mood_score, recorded_at, student_id')
            .eq('session_id', sessionId)
            .order('recorded_at', { ascending: true });

        if (eventsError) throw eventsError;

        // Optionally group events by minute to present a single unified timeline 
        // Or return raw events and let the frontend format it.
        // Let's create an aggregated timeline across the whole class per minute
        const timelineMap = new Map();

        events.forEach(event => {
            const timeKey = new Date(event.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!timelineMap.has(timeKey)) {
                timelineMap.set(timeKey, { time: timeKey, count: 0, totalScore: 0 });
            }
            const current = timelineMap.get(timeKey);
            current.count++;
            current.totalScore += event.mood_score;
        });

        const timeline = Array.from(timelineMap.values()).map(entry => ({
            time: entry.time,
            averageSatisfaction: Math.round(entry.totalScore / entry.count)
        }));

        return NextResponse.json({
            durationSeconds: latestSession.duration_seconds,
            averageSatisfaction: latestSession.average_satisfaction,
            studentStats: studentStats,
            timeline: timeline
        }, { status: 200 });

    } catch (error: any) {
        console.error("Fetch Statistics Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
