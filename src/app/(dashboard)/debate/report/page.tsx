'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDebateStore } from '@/store/useDebateStore';
import { Award, BrainCircuit, Activity, AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EvaluationData {
    argumentStrength: number;
    vocabularyScore: number;
    fallaciesSpotted: Array<{ name: string; description: string }>;
    overallFeedback: string;
    improvementTips: string[];
}

export default function DebateReportPage() {
    const router = useRouter();
    const { topic, userStance, transcript, resetDebate, status, evaluation, saveEvaluation } = useDebateStore();

    const [evalData, setEvalData] = useState<EvaluationData | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(true);

    useEffect(() => {
        // If there's no transcript or topic, they refreshed the page or directly navigated here
        if (!topic || transcript.length === 0) {
            toast.error("No active debate found.");
            router.push('/debate');
            return;
        }

        // If resuming a completed debate, load the stored evaluation
        if (status === 'completed' && evaluation) {
            setEvalData(evaluation);
            setIsEvaluating(false);
            return;
        }

        const fetchEvaluation = async () => {
            try {
                const res = await fetch('/api/debate/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, userStance, transcript })
                });

                if (!res.ok) throw new Error("Evaluation failed");
                const data = await res.json();
                setEvalData(data);

                // Save it back to store & DB
                await saveEvaluation(data);

            } catch (error) {
                console.error(error);
                toast.error("Could not generate debate evaluation.");
            } finally {
                setIsEvaluating(false);
            }
        };

        fetchEvaluation();
    }, [topic, userStance, transcript, router, status, evaluation, saveEvaluation]);

    const handleExit = () => {
        resetDebate();
        router.push('/dashboard');
    };

    if (isEvaluating) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-2 bg-blue-500/40 rounded-full animate-pulse" />
                    <div className="absolute inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <BrainCircuit size={32} className="text-white animate-bounce" />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                        Adjudicating Debate...
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Analyzing argument structures, checking facts, and spotting fallacies.
                    </p>
                </div>
            </div>
        );
    }

    if (!evalData) return null; // Handled by the redirect or error toast

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                        Debate Evaluation
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg flex items-center gap-2">
                        Topic: <span className="text-slate-800 dark:text-slate-200 font-bold">{topic}</span>
                    </p>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={handleExit}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all text-sm"
                    >
                        <ArrowLeft size={16} />
                        Exit to Dashboard
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Scores & Feedback */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Primary Score Cards */}
                    <div className="grid grid-cols-2 gap-6">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 text-white/10">
                                <Activity size={100} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-2">Argument Strength</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black tracking-tighter">{evalData.argumentStrength}</span>
                                    <span className="text-blue-200 font-bold">/ 100</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Vocabulary & Rhetoric</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">{evalData.vocabularyScore}</span>
                                <span className="text-slate-400 font-bold">/ 100</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Overall Feedback */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Award className="text-amber-500" />
                            Adjudicator's Verdict
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                            {evalData.overallFeedback}
                        </p>
                    </motion.div>

                    {/* Improvement Tips */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700"
                    >
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <BrainCircuit className="text-blue-500" />
                            Areas for Improvement
                        </h3>
                        <div className="space-y-4">
                            {evalData.improvementTips.map((tip, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <ChevronRight size={14} />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Fallacies & Transcript */}
                <div className="space-y-6">
                    {/* Fallacies */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <AlertTriangle className={evalData.fallaciesSpotted.length > 0 ? "text-rose-500" : "text-emerald-500"} />
                            Logical Fallacies
                        </h3>

                        {evalData.fallaciesSpotted.length === 0 ? (
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">Excellent debate! No major logical fallacies were detected in your arguments.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {evalData.fallaciesSpotted.map((f, idx) => (
                                    <div key={idx} className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4">
                                        <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-2">
                                            <XCircle size={14} /> {f.name}
                                        </h4>
                                        <p className="text-sm text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
                                            {f.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Mini Transcript */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">Debate Transcript</h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {transcript.map((turn, i) => (
                                <div key={i} className="space-y-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${turn.speaker === 'user' ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {turn.speaker}
                                    </span>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                        {turn.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
