import { create } from 'zustand';

export type DebateTurn = {
    speaker: 'user' | 'ai';
    text: string;
    critique?: string | null; // AI's critique of the user's turn
    timestamp: number;
};

interface DebateState {
    topic: string;
    userStance: 'for' | 'against';
    aiStance: 'for' | 'against';
    transcript: DebateTurn[];
    isLive: boolean;
    setDebateSetup: (topic: string, stance: 'for' | 'against') => void;
    addTurn: (turn: DebateTurn) => void;
    updateLastTurnCritique: (critique: string) => void;
    endDebate: () => void;
    resetDebate: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
    topic: '',
    userStance: 'for',
    aiStance: 'against',
    transcript: [],
    isLive: false,

    setDebateSetup: (topic, stance) => set({
        topic,
        userStance: stance,
        aiStance: stance === 'for' ? 'against' : 'for',
        transcript: [],
        isLive: true,
    }),

    addTurn: (turn) => set((state) => ({
        transcript: [...state.transcript, turn]
    })),

    updateLastTurnCritique: (critique) => set((state) => {
        const transcript = [...state.transcript];
        // Find the last user turn
        for (let i = transcript.length - 1; i >= 0; i--) {
            if (transcript[i].speaker === 'user') {
                transcript[i] = { ...transcript[i], critique };
                break;
            }
        }
        return { transcript };
    }),

    endDebate: () => set({ isLive: false }),

    resetDebate: () => set({ topic: '', transcript: [], isLive: false }),
}));
