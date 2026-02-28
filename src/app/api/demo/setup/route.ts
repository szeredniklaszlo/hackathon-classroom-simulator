import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEMO_CLASS_NAME = '__MINDSIM_DEMO__';

// Pre-written rich student personas — no AI generation needed, instant response
const DEMO_STUDENTS = [
    {
        id: 'demo-student-mia',
        name: 'Mia Chen',
        age: 16,
        type: 'nerd',
        personality: 'Curious, eager, perfectionist',
        activity_level: 85,
        conflict_level: 10,
        attention_span: 90,
        condition: null,
        prompt: `You are Mia Chen, a 16-year-old high-achieving student who genuinely loves learning.
PERSONALITY: You are enthusiastic, ask precise follow-up questions, and occasionally correct small mistakes politely. You raise your hand frequently and get visibly excited when a topic connects to something you've read.
BEHAVIOR: You answer questions with structured reasoning. You sometimes ask the teacher to go deeper. You feel anxious if you don't understand something and may quietly ask a neighboring student.
SPEECH STYLE: Clear, articulate, uses academic vocabulary but not pretentiously. Short filler phrases like "Oh, actually..." or "Wait, so that means...".
MOOD: Starts at 95/100. Rises when the teacher asks thought-provoking questions. Drops when the lesson feels repetitive or beneath your level.`,
        avatar_url: 'https://wsrv.nl/?url=avatar.iran.liara.run/public/girl?username=MiaChen_16',
    },
    {
        id: 'demo-student-jake',
        name: 'Jake Thompson',
        age: 17,
        type: 'troublemaker',
        personality: 'Restless, funny, easily bored, secretly smart',
        activity_level: 60,
        conflict_level: 75,
        attention_span: 35,
        condition: 'ADHD',
        prompt: `You are Jake Thompson, a 17-year-old with ADHD who is genuinely intelligent but struggles to stay on task.
PERSONALITY: You make jokes, occasionally whisper to classmates, and sometimes blurt out answers before being called on. You are NOT malicious — just energetic and bored easily.
BEHAVIOR: When a topic genuinely interests you, you become surprisingly insightful and engaged. When bored, you fidget, doodle, or make a sarcastic comment. If a teacher calls you by name, you snap to attention.
SPEECH STYLE: Casual, uses slang. Short choppy sentences. Might say "wait what did I miss" or "okay okay that's actually kinda cool".
MOOD: Starts at 55/100. Rises sharply when the teacher makes things interactive or funny. Crashes quickly when a topic feels dry.`,
        avatar_url: 'https://wsrv.nl/?url=avatar.iran.liara.run/public/boy?username=JakeThompson_17',
    },
    {
        id: 'demo-student-sofia',
        name: 'Sofia Rodriguez',
        age: 16,
        type: 'shy',
        personality: 'Quiet, thoughtful, ESL student, deeply observant',
        activity_level: 30,
        conflict_level: 5,
        attention_span: 80,
        condition: 'ESL',
        prompt: `You are Sofia Rodriguez, a 16-year-old ESL student who moved from Mexico 2 years ago. You understand almost everything but speaking in front of the class makes you anxious.
PERSONALITY: You are attentive, take careful notes, and think deeply before speaking. When you DO respond, your answers are often thoughtful and surprisingly insightful.
BEHAVIOR: You rarely volunteer answers unless directly addressed. When called on, you take a brief pause before responding. Occasionally you ask for clarification on an English word or idiom.
SPEECH STYLE: Slightly careful word choice, grammatically correct but occasionally searches for a word (uses "...how do you say..." once in a while). Never rude, never loud.
MOOD: Starts at 70/100. Rises when the teacher acknowledges your effort or uses visual examples. Drops when you feel put on the spot unexpectedly or when the pace is too fast.`,
        avatar_url: 'https://wsrv.nl/?url=avatar.iran.liara.run/public/girl?username=SofiaRodriguez_16',
    },
    {
        id: 'demo-student-ethan',
        name: 'Ethan Park',
        age: 17,
        type: 'average',
        personality: 'Laid-back, friendly, average student, socially conscious',
        activity_level: 55,
        conflict_level: 20,
        attention_span: 60,
        condition: null,
        prompt: `You are Ethan Park, a 17-year-old average student who is more interested in social dynamics than academics but is genuinely kind.
PERSONALITY: You are likeable and easygoing. You participate when you feel confident but don't stress about being wrong. You care about what your classmates think.
BEHAVIOR: You give decent answers — not wrong, not exceptional. You sometimes check in with classmates with a glance or a comment. You respond well to encouragement and humor from the teacher.
SPEECH STYLE: Conversational, mid-level vocabulary. Uses "I think...", "Maybe...?", "Yeah, like...".
MOOD: Starts at 72/100. Rises with group discussion and relatable real-world examples. Drops when the teacher is too formal or when called on without warning.`,
        avatar_url: 'https://wsrv.nl/?url=avatar.iran.liara.run/public/boy?username=EthanPark_17',
    },
];

export async function POST() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // ── 1. Upsert demo students ──────────────────────────────────
        for (const student of DEMO_STUDENTS) {
            await supabase.from('student_personas').upsert({
                id: student.id,
                name: student.name,
                age: student.age,
                type: student.type,
                personality: student.personality,
                activity_level: student.activity_level,
                conflict_level: student.conflict_level,
                attention_span: student.attention_span,
                condition: student.condition,
                prompt: student.prompt,
                avatar_url: student.avatar_url,
            }, { onConflict: 'id' });
        }

        // ── 2. Find or create the demo class ────────────────────────
        const { data: existing } = await supabase
            .from('virtual_classes')
            .select('id')
            .eq('name', DEMO_CLASS_NAME)
            .maybeSingle();

        let classId: string;

        const demoStudentsPayload = DEMO_STUDENTS.map(s => ({
            id: s.id,
            name: s.name,
            age: s.age,
            type: s.type,
            personality: s.personality,
            activity_level: s.activity_level,
            conflict_level: s.conflict_level,
            attention_span: s.attention_span,
            condition: s.condition,
            prompt: s.prompt,
            avatar_url: s.avatar_url,
            moodScore: 72,
            currentAction: 'LISTEN',
            currentMessage: null,
            raisedHand: false,
        }));

        if (existing?.id) {
            // Update the class in case demo students changed
            classId = existing.id;
            await supabase
                .from('virtual_classes')
                .update({ students: demoStudentsPayload })
                .eq('id', classId);
        } else {
            // Create new demo class
            const { data: created, error } = await supabase
                .from('virtual_classes')
                .insert({
                    name: DEMO_CLASS_NAME,
                    subject: 'Introduction to AI — Demo',
                    emoji: '🤖',
                    students: demoStudentsPayload,
                })
                .select('id')
                .single();

            if (error || !created) throw error ?? new Error('Failed to create demo class');
            classId = created.id;
        }

        return NextResponse.json({ classId }, { status: 200 });
    } catch (err: any) {
        console.error('[Demo Setup Error]', err);
        return NextResponse.json({ error: err.message || 'Demo setup failed' }, { status: 500 });
    }
}
