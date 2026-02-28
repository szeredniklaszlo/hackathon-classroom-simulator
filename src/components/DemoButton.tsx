'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

interface DemoButtonProps {
    variant?: 'hero' | 'sidebar' | 'nav';
    className?: string;
}

export default function DemoButton({ variant = 'hero', className = '' }: DemoButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { setClasses, setStudents } = useStore();

    const handleDemo = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/demo/setup', { method: 'POST' });
            if (!res.ok) throw new Error('Demo setup failed');
            const { classId } = await res.json();

            // Also refresh the store so the classroom page finds the class immediately
            const [classesRes, studentsRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/students'),
            ]);
            if (classesRes.ok) {
                const { classes } = await classesRes.json();
                setClasses(classes);
            }
            if (studentsRes.ok) {
                const { students } = await studentsRes.json();
                setStudents(students);
            }

            router.push(`/class/${classId}`);
        } catch (err: any) {
            setError('Could not start demo. Please try again.');
            setIsLoading(false);
        }
    };

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleDemo}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold py-2.5 px-4 text-sm shadow-md shadow-sky-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 ${className}`}
            >
                {isLoading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Setting up...
                    </>
                ) : (
                    <>
                        <span className="text-base">🚀</span> Try Demo
                    </>
                )}
            </button>
        );
    }

    if (variant === 'nav') {
        return (
            <button
                onClick={handleDemo}
                disabled={isLoading}
                className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all active:scale-95 disabled:opacity-60 ${className}`}
            >
                {isLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <span>▶</span>
                )}
                {isLoading ? 'Loading...' : 'Live Demo'}
            </button>
        );
    }

    // Default: hero variant
    return (
        <div className="flex flex-col items-start gap-1">
            <button
                onClick={handleDemo}
                disabled={isLoading}
                className={`group relative overflow-hidden flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white font-bold px-7 py-4 rounded-2xl transition-all text-base active:scale-95 disabled:opacity-60 ${className}`}
            >
                {isLoading ? (
                    <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Setting up demo...</span>
                    </>
                ) : (
                    <>
                        <span className="text-xl">🎬</span>
                        <span>Watch Live Demo</span>
                        <span className="text-white/60 text-sm font-normal">→</span>
                    </>
                )}
            </button>
            {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
        </div>
    );
}
