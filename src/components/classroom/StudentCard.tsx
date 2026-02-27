'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from 'lucide-react';
import { Student } from '@/types/shared';

// Helper for color based on mood
const getMoodBg = (score: number) => {
    if (score < 40) return "bg-red-50 dark:bg-red-900/20";
    if (score < 70) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-green-50 dark:bg-green-900/20";
};

export default function StudentCard({ student, idx }: { student: Student, idx: number }) {
    // Local state for displaying the message temporarily
    const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
    const [displayedAction, setDisplayedAction] = useState<'LISTEN' | 'RAISE_HAND' | 'ANSWER_DIRECTLY' | 'WHISPER' | 'INTERRUPT'>('LISTEN');

    useEffect(() => {
        if (student.currentMessage) {
            setDisplayedMessage(student.currentMessage);
            setDisplayedAction(student.currentAction || 'LISTEN');

            // Clear the bubble after 5 seconds
            const timer = setTimeout(() => {
                setDisplayedMessage(null);
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [student.currentMessage, student.currentAction]);

    return (
        <motion.div
            layout // Enable smooth position changes
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.05 }}
            className={`h-full w-full max-w-[240px] aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center p-4 relative shadow-sm transition-all duration-500
                ${getMoodBg(student.moodScore)} border-white ring-1 ring-slate-900/5 hover:shadow-md
            `}
        >
            {/* Speech Bubble */}
            <AnimatePresence>
                {displayedMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        // Note: Using relative z-index logic and absolute so it doesn't get clipped
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-max max-w-[220px] z-50 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative text-center">
                            {displayedAction === 'WHISPER' && <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">*(Whispering)*</span>}
                            {displayedAction === 'INTERRUPT' && <span className="text-xs text-red-500 dark:text-red-400 font-bold block mb-1">*(Interrupts)*</span>}
                            <p className="line-clamp-3 leading-snug">{displayedMessage}</p>
                            {/* Triangle pointer */}
                            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 rotate-45 rounded-sm"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hand Raise Indicator */}
            {student.raisedHand && (
                <div className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 z-10 animate-bounce">
                    <Hand className="text-amber-500 fill-amber-100" size={24} />
                </div>
            )}

            <div className="text-6xl mb-4 bg-white/50 dark:bg-white/10 w-24 h-24 rounded-full flex items-center justify-center shadow-inner border border-white dark:border-white/10 backdrop-blur-sm relative z-0">
                {student.emoji}
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl text-center shadow-sm w-full border border-white/50 dark:border-slate-700/50 z-10 relative">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-lg truncate">{student.name}</h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{student.type} • {student.age}y</p>
            </div>
        </motion.div>
    );
}
