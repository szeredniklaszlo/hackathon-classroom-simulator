'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Volume2 } from 'lucide-react';
import { Student } from '@/types/shared';
import { StudentAvatar } from '@/components/classroom/StudentAvatar';

// Helper for color based on mood
const getMoodBg = (score: number) => {
    if (score < 40) return "bg-red-50 dark:bg-red-900/20";
    if (score < 70) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-green-50 dark:bg-green-900/20";
};

export default function StudentCard({ student, idx, isSpeaking = false }: { student: Student, idx: number, isSpeaking?: boolean }) {
    // The parent page.tsx now handles audio playback and passes down the isSpeaking state

    return (
        <motion.div
            layout // Enable smooth position changes
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.05 }}
            className={`h-full w-full max-w-[240px] aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center p-4 relative shadow-sm transition-all duration-500
                ${getMoodBg(student.moodScore)} border-white ring-1 ring-slate-900/5 hover:shadow-md
                ${isSpeaking ? 'ring-4 ring-primary/40 dark:ring-sky-500/40' : ''}
            `}
        >
            {/* Audio Indicator */}
            <AnimatePresence>
                {isSpeaking && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-md border border-slate-200 dark:border-slate-700"
                    >
                        <Volume2 size={14} className="text-primary dark:text-sky-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Speaking...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Condition Label */}
            {student.condition && (
                <div className="absolute top-3 right-4 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full z-10 shadow-sm truncate max-w-[100px]">
                    {student.condition}
                </div>
            )}

            {/* Hand Raise Indicator */}
            {student.raisedHand && !isSpeaking && (
                <div className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 z-10 animate-bounce">
                    <Hand className="text-amber-500 fill-amber-100" size={24} />
                </div>
            )}

            <div className={`mb-4 w-24 h-24 text-5xl rounded-full flex items-center justify-center relative z-0 transition-all duration-300 ${isSpeaking ? 'scale-110 shadow-lg -translate-y-2' : 'shadow-md translate-y-0'} ring-2 ring-white/50 dark:ring-white/10 bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
                <StudentAvatar
                    name={student.name}
                    age={student.age}
                    avatarUrl={student.avatar_url}
                    className={`rounded-full ${isSpeaking ? 'animate-[bounce_0.5s_infinite]' : ''}`}
                />

                {/* Speaking animation rings */}
                {isSpeaking && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 dark:border-sky-400/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 dark:border-sky-400/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
                    </>
                )}
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl text-center shadow-sm w-full border border-white/50 dark:border-slate-700/50 z-10 relative">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-lg truncate">{student.name}</h4>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5" title={student.type}>{student.age} years old</p>
            </div>
        </motion.div>
    );
}
