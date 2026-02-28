'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebateStore } from '@/store/useDebateStore';
import { useAzureSTT } from '@/hooks/useAzureSTT';
import { Play, Square, Mic, MicOff, Send, MessageSquareQuote, AlertTriangle, ArrowRight, Activity, BrainCircuit, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

export default function DebateCoachPage() {
    const router = useRouter();
    const { topic, userStance, aiStance, transcript, isLive, setDebateSetup, addTurn, updateLastTurnCritique } = useDebateStore();


    // Setup State
    const [topicInput, setTopicInput] = useState('');
    const [stanceInput, setStanceInput] = useState<'for' | 'against'>('for');

    // Live State
    const [textInput, setTextInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);

    const { isListening, startListening, stopListening, fullTranscript, clearTranscript } = useAzureSTT();
    // Auth & History State
    const [userId, setUserId] = useState<string | null>(null);
    const [pastDebates, setPastDebates] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user.id || null;
            setUserId(uid);

            if (uid) {
                // Fetch past debates for this user
                const { data } = await supabase
                    .from('debates')
                    .select('*')
                    .eq('user_id', uid)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                if (data) setPastDebates(data);
            }
            setIsLoadingHistory(false);
        };
        fetchUserData();
    }, [isLive]); // Re-fetch when exiting a live debate back to setup

    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, isAiThinking]);

    // Setup Submit
    const handleStartDebate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicInput.trim()) {
            toast.error('Please enter a topic to debate.');
            return;
        }
        await setDebateSetup(topicInput.trim(), stanceInput, userId || undefined);
    };

    // User submits an argument
    const handleSendTurn = async (textOveride?: string) => {
        const textToUse = (textOveride || textInput || fullTranscript).trim();
        if (!textToUse || isAiThinking) return;

        // Clear inputs immediately
        setTextInput('');
        if (isListening) {
            stopListening();
        }
        clearTranscript();

        // 1. Add user turn
        addTurn({
            speaker: 'user',
            text: textToUse,
            timestamp: Date.now()
        });

        setIsAiThinking(true);

        // 2. Call API for AI response AND critique
        try {
            const res = await fetch('/api/debate/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    userStance,
                    aiStance,
                    transcript: useDebateStore.getState().transcript // pass updated transcript
                })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            // 3. Add AI critique to the user's turn
            updateLastTurnCritique(data.critique);

            // 4. Add AI response turn
            addTurn({
                speaker: 'ai',
                text: data.reply,
                timestamp: Date.now()
            });

            // 5. Play AI Audio TTS
            playAiAudio(data.reply);

        } catch (error) {
            console.error(error);
            toast.error('Failed to get AI response.');
        } finally {
            setIsAiThinking(false);
        }
    };

    const playAiAudio = async (text: string) => {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, studentType: 'coach' }), // 'coach' or any default voice
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                await audio.play();
            }
        } catch (e) {
            console.error("TTS error", e);
        }
    };

    const handleConcludeDebate = () => {
        useDebateStore.getState().completeDebate();
        router.push('/debate/report');
    };

    const handleSaveAndExit = () => {
        // Just route away, store is automatically synced
        router.push('/dashboard');
        useDebateStore.getState().resetDebate();
    };

    const handleResumeDebate = (debate: any) => {
        useDebateStore.getState().loadDebate(debate);
    };

    const handleViewReport = (debate: any) => {
        useDebateStore.getState().loadDebate(debate);
        router.push('/debate/report');
    };

    // ─── SETUP VIEW ────────────────────────────────────────────────────────────
    if (!isLive) {
        return (
            <div className="max-w-7xl mx-auto p-6 md:p-12 flex flex-col lg:flex-row gap-10">

                {/* Left: Setup Form */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-8 xl:p-12 shadow-xl border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                        <MessageSquareQuote size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
                        Debate Coach
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-xl">
                        Sharpen your argumentation skills. Pick a topic, take a stance, and the AI Examiner will challenge you in real-time, providing live critiques on logical fallacies and argument strength.
                    </p>

                    <form onSubmit={handleStartDebate} className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Topic to Debate
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Artificial Intelligence should replace traditional grading..."
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                className="w-full text-lg px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                Your Stance
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStanceInput('for')}
                                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${stanceInput === 'for'
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
                                        }`}
                                >
                                    I am FOR this
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStanceInput('against')}
                                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${stanceInput === 'against'
                                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-rose-300'
                                        }`}
                                >
                                    I am AGAINST this
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="group w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98]"
                            >
                                Start New Debate
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: History */}
                <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-6">Your Recent Debates</h3>

                    {isLoadingHistory ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 h-28 animate-pulse" />
                            ))}
                        </div>
                    ) : pastDebates.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
                            <BrainCircuit size={40} className="mx-auto text-slate-400 mb-3 opacity-50" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No past debates found.</p>
                            <p className="text-sm text-slate-400 mt-1">Start a new one to see it here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {pastDebates.map(debate => (
                                <div key={debate.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors shadow-sm">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                        <h4 className="font-bold text-slate-800 dark:text-white truncate" title={debate.topic}>
                                            {debate.topic}
                                        </h4>
                                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${debate.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                            }`}>
                                            {debate.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                        You argued: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{debate.user_stance}</span> •
                                        {new Date(debate.updated_at).toLocaleDateString()}
                                    </p>

                                    <div className="flex justify-end">
                                        {debate.status === 'completed' ? (
                                            <button
                                                onClick={() => handleViewReport(debate)}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                                            >
                                                View Report <ArrowRight size={12} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleResumeDebate(debate)}
                                                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg transition-all"
                                            >
                                                Resume Debate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── LIVE DEBATE VIEW ──────────────────────────────────────────────────────
    // Get the most recent user turn that has a critique
    const lastCritique = [...transcript].reverse().find(t => t.speaker === 'user' && t.critique)?.critique;

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] max-w-7xl mx-auto flex gap-6 p-6">

            {/* Left: Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-md">
                            {topic}
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                You: {userStance.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                AI: {aiStance.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveAndExit}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Save & Exit
                        </button>
                        <button
                            onClick={handleConcludeDebate}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                        >
                            <Square size={12} className="fill-current" />
                            Evaluate & Conclude
                        </button>
                    </div>
                </div>

                {/* Transcript Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {transcript.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <BrainCircuit size={48} className="opacity-20" />
                            <p className="text-sm font-medium">The AI Examiner is ready. Make your opening argument.</p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {transcript.map((turn, i) => (
                            <motion.div
                                key={turn.timestamp + i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 ${turn.speaker === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                                    }`}>
                                    <p className="leading-relaxed">{turn.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isAiThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-end gap-2">
                        {/* Voice Input */}
                        <div className="relative flex-1">
                            {(isListening || fullTranscript) && (
                                <div className="absolute -top-12 left-0 right-0 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-lg text-sm truncate animate-in fade-in slide-in-from-bottom-2">
                                    {fullTranscript || "Listening..."}
                                </div>
                            )}
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Type your argument or use the microphone..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-[52px] dark:text-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendTurn();
                                    }
                                }}
                            />
                        </div>

                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-3.5 rounded-xl transition-all ${isListening
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                        <button
                            onClick={() => handleSendTurn()}
                            disabled={(!textInput.trim() && !fullTranscript.trim()) || isAiThinking}
                            className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-slate-700 text-white rounded-xl transition-all disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Live Critique Panel */}
            <div className="w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="text-white/80" />
                        <h3 className="font-bold text-lg">Live Examiner</h3>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed mb-6">
                        The AI is analyzing your arguments in real-time. It will debate you strictly while pointing out fallacies or structural weaknesses.
                    </p>

                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/20">
                        <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} /> Last Turn Critique
                        </h4>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={lastCritique || 'empty'}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-sm font-medium leading-relaxed"
                            >
                                {isAiThinking ? (
                                    <span className="flex items-center gap-2 text-white/60">
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing argument...
                                    </span>
                                ) : lastCritique ? (
                                    lastCritique
                                ) : (
                                    <span className="text-white/50 italic">Waiting for your first argument to analyze...</span>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Common Fallacies to Avoid</h4>
                    <ul className="space-y-4">
                        <li className="flex gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <XCircle size={14} />
                            </div>
                            <div>
                                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Ad Hominem</strong>
                                <span className="text-slate-500 dark:text-slate-400">Attacking the person instead of the argument.</span>
                            </div>
                        </li>
                        <li className="flex gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <XCircle size={14} />
                            </div>
                            <div>
                                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Strawman</strong>
                                <span className="text-slate-500 dark:text-slate-400">Misrepresenting the opponent's view to make it easier to attack.</span>
                            </div>
                        </li>
                        <li className="flex gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <XCircle size={14} />
                            </div>
                            <div>
                                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Slippery Slope</strong>
                                <span className="text-slate-500 dark:text-slate-400">Arguing that a small step inevitably leads to a chain of extreme events.</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
