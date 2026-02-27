'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { mockClasses, mockStudents } from '@/lib/mockData';
import { Student } from '@/types/shared';
import { toast } from 'sonner';
import { Play, Square, Save, UserPlus, Hand, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function VirtualClassroom() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    // Find initial class or fallback
    const initialClass = mockClasses.find(c => c.id === classId) || mockClasses[0];

    const [students, setStudents] = useState<Student[]>(initialClass.students);
    const [isPlaying, setIsPlaying] = useState(false);
    const [seconds, setSeconds] = useState(0);

    // Timer simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);

                // Randomly adjust moods slightly while playing to make it feel alive
                setStudents(prev => prev.map(s => ({
                    ...s,
                    moodScore: Math.min(100, Math.max(0, s.moodScore + (Math.random() > 0.5 ? 1 : -1)))
                })));

            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleTogglePlay = () => {
        if (isPlaying) {
            // Stopping the simulation redirects to the diary/report
            toast.success("Simulation Ended", { description: "Preparing virtual diary..." });
            setTimeout(() => {
                router.push(`/report/${classId}`);
            }, 800);
        } else {
            setIsPlaying(true);
            toast.info("Simulation Started", { description: "The virtual class has begun." });
        }
    };

    const handleSaveRoster = () => {
        toast.success("Sikeres mentés az adatbázisba", {
            description: "Class roster has been successfully updated.",
        });
    };

    const handleAddStudent = () => {
        // Pick a random student not already in the class (or just generate a clone if all are added)
        const available = mockStudents.filter(s => !students.find(cs => cs.id === s.id));
        if (available.length > 0) {
            const newStudent = available[Math.floor(Math.random() * available.length)];
            setStudents([...students, newStudent]);
            toast.success(`Added ${newStudent.name} to the classroom.`);
        } else {
            // Just clone one for demo purposes
            const clone = { ...mockStudents[Math.floor(Math.random() * mockStudents.length)], id: `s${Date.now()}` };
            setStudents([...students, clone]);
            toast.success(`Generated new student: ${clone.name} (Clone)`);
        }
    };

    // Sort students by mood (ascending, lowest first) for the Mood Meter sidebar
    const sortedByMood = useMemo(() => {
        return [...students].sort((a, b) => a.moodScore - b.moodScore);
    }, [students]);

    // Derive color based on mood percentage
    const getMoodColor = (score: number) => {
        if (score < 40) return "text-red-500 bg-red-100 border-red-200";
        if (score < 70) return "text-amber-500 bg-amber-100 border-amber-200";
        return "text-green-500 bg-green-100 border-green-200";
    };

    const getMoodBg = (score: number) => {
        if (score < 40) return "bg-red-50";
        if (score < 70) return "bg-amber-50";
        return "bg-green-50";
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg leading-tight">{initialClass.subject}</h1>
                        <p className="text-xs text-slate-500 font-medium">{initialClass.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isPlaying && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-bold border border-red-100 animate-pulse outline-none">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Live: {formatTime(seconds)}
                        </div>
                    )}
                    <button onClick={handleSaveRoster} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-semibold border border-transparent hover:border-slate-200">
                        <Save size={18} />
                        <span className="hidden sm:inline">Save Roster</span>
                    </button>
                    <button onClick={handleAddStudent} className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors px-3 py-2 rounded-lg text-sm font-semibold">
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Add Student</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Classroom Area */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col pb-32">

                    {/* Simulation Viewport */}
                    <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-center relative overflow-hidden">

                        {!isPlaying && (
                            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] z-10 flex items-center justify-center flex-col gap-4">
                                <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm border border-slate-100">
                                    <Clock className="text-slate-400 mb-3" size={32} />
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Class Not Started</h3>
                                    <p className="text-slate-500 text-sm mb-6">Press play to begin the simulation. Students will react dynamically as time progresses.</p>
                                    <button
                                        onClick={handleTogglePlay}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-blue-600 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                                    >
                                        <Play size={20} className="fill-current" /> Initialize Class
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr h-full place-items-center">
                            <AnimatePresence>
                                {students.map((student, idx) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`h-full w-full max-w-[240px] aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center p-4 relative shadow-sm transition-all duration-500
                      ${getMoodBg(student.moodScore)} border-white ring-1 ring-slate-900/5 hover:shadow-md
                    `}
                                    >
                                        {/* Hand Raise Indicator */}
                                        {student.raisedHand && (
                                            <div className="absolute -top-3 -right-3 bg-white p-2 rounded-full shadow-lg border border-slate-100 z-10 animate-bounce">
                                                <Hand className="text-amber-500 fill-amber-100" size={24} />
                                            </div>
                                        )}

                                        <div className="text-6xl mb-4 bg-white/50 w-24 h-24 rounded-full flex items-center justify-center shadow-inner border border-white backdrop-blur-sm">
                                            {student.emoji}
                                        </div>

                                        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-center shadow-sm w-full border border-white/50">
                                            <h4 className="font-extrabold text-slate-800 tracking-tight text-lg">{student.name}</h4>
                                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{student.type} • {student.age}y</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Mood Meter */}
                <aside className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex flex-col shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] z-20 hidden md:flex">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                            <span className="text-primary">📊</span> Mood Meter
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Ascending order (lowest engagement first)</p>
                    </div>

                    <div className="p-4 flex-1 space-y-3">
                        <AnimatePresence>
                            {sortedByMood.map(student => (
                                <motion.div
                                    key={student.id}
                                    layoutId={`mood-${student.id}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex items-center gap-3"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${getMoodColor(student.moodScore)}`}>
                                        {student.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-sm text-slate-800 truncate">{student.name}</h4>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getMoodColor(student.moodScore)}`}>
                                                {student.moodScore}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full ${student.moodScore < 40 ? 'bg-red-500' : student.moodScore < 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${student.moodScore}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* Floating Bottom Control Bar */}
                <div className="absolute bottom-6 left-0 right-0 md:right-80 flex justify-center z-30 px-6 pointer-events-none">
                    <motion.div
                        className="glass-panel px-6 py-4 border-slate-200 shadow-xl flex items-center gap-6 pointer-events-auto"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        {/* The primary interaction - Big Play/Stop button */}
                        <button
                            onClick={handleTogglePlay}
                            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-lg shadow-md transition-all active:scale-95 ${isPlaying
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                                : 'bg-primary hover:bg-blue-600 text-white shadow-primary/30'
                                }`}
                        >
                            {isPlaying ? (
                                <> <Square className="fill-current" size={20} /> End Simulation </>
                            ) : (
                                <> <Play className="fill-current" size={20} /> Start Class </>
                            )}
                        </button>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
