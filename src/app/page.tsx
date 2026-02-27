'use client';

import { motion } from "framer-motion";
import { GraduationCap, Sparkles, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LandingPage() {
    const handleToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Decorative background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="z-10 w-full max-w-4xl text-center space-y-8"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-slate-800/80 rounded-2xl text-primary shadow-sm border border-blue-100 dark:border-slate-700">
                        <GraduationCap size={48} />
                    </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
                    Welcome to the <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 dark:from-sky-400 dark:to-indigo-400">
                        AI Classroom Simulator
                    </span>
                </h1>

                <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Master your teaching methods with intelligent, LLM-driven student avatars. Practice, adapt, and get real-time feedback in a safe, dynamic learning environment.
                </p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                >
                    <Link
                        href="/login"
                        className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-600 dark:hover:bg-sky-500 transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto justify-center"
                    >
                        <User size={20} />
                        Sign In / Register
                    </Link>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 w-full sm:w-auto justify-center"
                    >
                        <Sparkles size={20} className="text-primary" />
                        Continue as Guest
                        <ArrowRight size={18} className="ml-1" />
                    </Link>
                </motion.div>
            </motion.div>

            {/* Mock visuals */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-16 w-full max-w-5xl relative z-10"
            >
                <div className="glass-panel dark:bg-slate-900/40 dark:border-slate-700/50 p-2 overflow-hidden shadow-2xl border-white/40 ring-1 ring-slate-900/5 dark:ring-white/10">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl h-64 md:h-80 flex flex-col items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">

                        {/* Abstract UI representation */}
                        <div className="absolute top-4 left-4 right-4 flex gap-4 opacity-50 dark:opacity-30">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-sky-900/50 flex-shrink-0"></div>
                            <div className="h-12 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 absolute bottom-4 left-4 right-4 opacity-70">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-800 h-24 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-3 flex flex-col gap-2">
                                    <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                    <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600/50 rounded-md mt-auto"></div>
                                </div>
                            ))}
                        </div>

                        <p className="font-medium text-lg relative z-10 bg-white/50 dark:bg-slate-800/80 dark:text-slate-300 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-slate-100 dark:border-slate-700">Interactive Workspace Preview</p>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
