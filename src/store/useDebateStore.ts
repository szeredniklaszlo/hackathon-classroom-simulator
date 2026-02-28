import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export type DebateTurn = {
    speaker: 'user' | 'ai';
    text: string;
    critique?: string | null;
    timestamp: number;
};

interface DebateState {
    debateId: string | null;
    topic: string;
    userStance: 'for' | 'against';
    aiStance: 'for' | 'against';
    transcript: DebateTurn[];
    isLive: boolean;
    status: 'in_progress' | 'completed';
    evaluation: any | null;

    // Actions
    setDebateSetup: (topic: string, stance: 'for' | 'against', userId?: string) => Promise<void>;
    addTurn: (turn: DebateTurn) => void;
    updateLastTurnCritique: (critique: string) => void;
    completeDebate: () => void;
    saveEvaluation: (evalData: any) => Promise<void>;
    loadDebate: (debate: any) => void;
    resetDebate: () => void;
}

const supabase = createClient();

const syncToDb = async (state: Partial<DebateState>, id: string | null) => {
    if (!id) return;
    try {
        await supabase.from('debates').update({
            transcript: state.transcript,
            status: state.status,
            evaluation: state.evaluation,
            updated_at: new Date().toISOString()
        }).eq('id', id);
    } catch (e) {
        console.error("Failed to sync debate to DB", e);
    }
};

export const useDebateStore = create<DebateState>((set, get) => ({
    debateId: null,
    topic: '',
    userStance: 'for',
    aiStance: 'against',
    transcript: [],
    isLive: false,
    status: 'in_progress',
    evaluation: null,

    setDebateSetup: async (topic, stance, userId) => {
        // Create the DB row immediately so we have an ID
        const aiS = stance === 'for' ? 'against' : 'for';

        try {
            const { data, error } = await supabase.from('debates').insert({
                topic,
                user_stance: stance,
                ai_stance: aiS,
                user_id: userId || null,
                status: 'in_progress',
                transcript: []
            }).select('id').single();

            if (error) throw error;

            set({
                debateId: data.id,
                topic,
                userStance: stance,
                aiStance: aiS,
                transcript: [],
                isLive: true,
                status: 'in_progress',
                evaluation: null
            });
        } catch (error) {
            console.error("Error creating debate in DB:", error);
            // Fallback for local-only if DB fails
            set({
                debateId: null,
                topic,
                userStance: stance,
                aiStance: aiS,
                transcript: [],
                isLive: true,
                status: 'in_progress',
                evaluation: null
            });
        }
    },

    addTurn: (turn) => set((state) => {
        const newTranscript = [...state.transcript, turn];
        syncToDb({ transcript: newTranscript, status: state.status }, state.debateId);
        return { transcript: newTranscript };
    }),

    updateLastTurnCritique: (critique) => set((state) => {
        const transcript = [...state.transcript];
        for (let i = transcript.length - 1; i >= 0; i--) {
            if (transcript[i].speaker === 'user') {
                transcript[i] = { ...transcript[i], critique };
                break;
            }
        }
        syncToDb({ transcript, status: state.status }, state.debateId);
        return { transcript };
    }),

    completeDebate: () => set((state) => {
        syncToDb({ transcript: state.transcript, status: 'completed' }, state.debateId);
        return { isLive: false, status: 'completed' };
    }),

    saveEvaluation: async (evalData) => {
        const state = get();
        if (state.debateId) {
            try {
                await supabase.from('debates').update({
                    evaluation: evalData,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                }).eq('id', state.debateId);
            } catch (e) {
                console.error("Eval sync error", e);
            }
        }
        set({ evaluation: evalData, status: 'completed', isLive: false });
    },

    loadDebate: (debate) => set({
        debateId: debate.id,
        topic: debate.topic,
        userStance: debate.user_stance as any,
        aiStance: debate.ai_stance as any,
        transcript: debate.transcript || [],
        status: debate.status,
        evaluation: debate.evaluation,
        isLive: debate.status === 'in_progress'
    }),

    resetDebate: () => set({
        debateId: null,
        topic: '',
        transcript: [],
        isLive: false,
        status: 'in_progress',
        evaluation: null
    }),
}));
