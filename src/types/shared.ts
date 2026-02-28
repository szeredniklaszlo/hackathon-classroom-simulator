// ==========================================
// Vibe Coding Baseline Contracts
// ==========================================

// 1. A Diák Profilja (Amit a Creator generál és a Frontend letárol)
export interface StudentProfile {
    id: string; // pl. "student_1"
    name: string;
    personality: string; // Részletes system prompt generált szövege
    baseEngagement: number; // 0-100
}

// 2. Az Osztályterem / Bemenet (Amit a Frontend küld az Orchestratornak)
export interface ClassroomContext {
    sessionId: string;
    students: StudentProfile[]; // Az aktív diákok
    teacherTranscriptChunk: string; // A legújabb, PreProcessor által validált szöveg
    fullTranscript?: { speaker: string, text: string }[]; // A teljes korábbi beszélgetés
}

// 3. A Diák Állapot / Kimenet (Amit az Orchestrator ad vissza a Frontendnek)
export interface StudentResponse {
    studentId: string;
    internalThought: string;
    action: 'LISTEN' | 'RAISE_HAND' | 'ANSWER_DIRECTLY' | 'WHISPER' | 'INTERRUPT';
    message: string | null;
    newEngagement: number; // 0-100
    emotion: 'curious' | 'bored' | 'anxious' | 'excited';
}

export interface PreProcessorResponse {
    isProcessed: boolean;
    extractedContext: string | null;
    remainingBuffer: string;
}

export interface OrchestratorResponse {
    responses: StudentResponse[];
}

// ==========================================
// KORÁBBI (Legacy / Jelenleg használt) Típusok
// (ezeket is itt tároljuk a közös hozzáféréshez)
// ==========================================

export type StudentType = 'Fast Learner' | 'ESL Student' | 'Easily Distracted' | 'Deep Thinker' | 'Anxious Achiever' | 'Class Clown';

export interface Student {
    id: string;
    name: string;
    age: number;
    type: StudentType;
    moodScore: number; // 0-100
    raisedHand: boolean;
    learningStatus: string;
    struggles?: string;
    personality?: string;
    prompt?: string;
    condition?: string | null;
    avatar_url?: string;
    created_at?: string;
    currentAction?: 'LISTEN' | 'RAISE_HAND' | 'ANSWER_DIRECTLY' | 'WHISPER' | 'INTERRUPT';
    currentMessage?: string | null;
}

export interface VirtualClass {
    id: string;
    name: string;
    subject: string;
    description: string;
    students: Student[];
}

export interface TranscriptEntry {
    id: string;
    speaker: 'Teacher' | string; // 'Teacher' or student name
    text: string;
    timestamp: string;
    emotion?: 'neutral' | 'happy' | 'confused' | 'bored' | 'engaged';
    // Engagement snapshot injected after each orchestrator tick (silent + speaking students)
    moodSnapshot?: Record<string, number>; // studentName -> moodScore (0-100)
}
