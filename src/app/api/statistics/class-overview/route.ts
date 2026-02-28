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
        // Fetch ALL sessions for this class to calculate aggregates
        const { data: classSessions, error: sessionError } = await supabase
            .from('class_sessions')
            .select('duration_seconds, average_satisfaction')
            .eq('class_id', classId);

        if (sessionError) throw sessionError;

        if (!classSessions || classSessions.length === 0) {
            return NextResponse.json({
                totalDurationSeconds: 0,
                overallAverageSatisfaction: 0,
                sessionCount: 0
            }, { status: 200 });
        }

        // Calculate aggregates
        let totalDurationSeconds = 0;
        let totalSatisfaction = 0;

        classSessions.forEach(session => {
            totalDurationSeconds += session.duration_seconds || 0;
            totalSatisfaction += session.average_satisfaction || 0;
        });

        const overallAverageSatisfaction = Math.round(totalSatisfaction / classSessions.length);

        return NextResponse.json({
            totalDurationSeconds,
            overallAverageSatisfaction,
            sessionCount: classSessions.length
        }, { status: 200 });

    } catch (error: any) {
        console.error("Fetch Class Overview Statistics Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
