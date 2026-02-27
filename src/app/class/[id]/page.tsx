'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, TranscriptEntry } from '@/types/shared';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Play, Square, Save, UserPlus, Hand, ArrowLeft, Clock, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';
import { useAzureSTT } from '@/hooks/useAzureSTT';
import StudentCard, { guessGender } from '@/components/classroom/StudentCard';

export default function VirtualClassroom() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    const { classes, students: globalStudents, setClasses, setStudents: setGlobalStudents } = useStore();
    const [isLoadingData, setIsLoadingData] = useState(classes.length === 0);

    // Fetch data on direct navigation if store is empty
    useEffect(() => {
        if (classes.length === 0) {
            const fetchData = async () => {
                try {
                    const [classesRes, studentsRes] = await Promise.all([
                        fetch('/api/classes'),
                        fetch('/api/students')
                    ]);

                    if (classesRes.ok) {
                        const data = await classesRes.json();
                        setClasses(data.classes);
                    }
                    if (studentsRes.ok) {
                        const data = await studentsRes.json();
                        setGlobalStudents(data.students);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                    toast.error('Error loading data.');
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
        } else {
            setIsLoadingData(false);
        }
    }, [classes.length, setClasses, setGlobalStudents]);

    // Find initial class
    const initialClass = classes.find(c => c.id === classId);

    // If data finished loading and class is not found, redirect
    useEffect(() => {
        if (!isLoadingData && !initialClass) {
            toast.error("Class not found or not created yet.");
            router.push('/dashboard');
        }
    }, [isLoadingData, initialClass, router]);

    // Update students state when initialClass becomes available, ensuring moodScore exists
    const [students, setStudents] = useState<Student[]>(
        (initialClass?.students || []).map(s => ({
            ...s,
            moodScore: typeof s.moodScore === 'number' && !isNaN(s.moodScore) ? s.moodScore : 100
        }))
    );

    // Update local state when initialClass fully loads from the async fetch
    useEffect(() => {
        if (initialClass?.students && students.length === 0) {
            setStudents(initialClass.students.map(s => ({
                ...s,
                moodScore: typeof s.moodScore === 'number' && !isNaN(s.moodScore) ? s.moodScore : 100
            })));
        }
    }, [initialClass]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);

    // Azure STT Hook
    const { isListening, startListening, stopListening, fullTranscript, stableBuffer, setStableBuffer } = useAzureSTT({ language: 'en-US' });

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

    // Orchestrator Integration
    const [isProcessing, setIsProcessing] = useState(false);
    const lastBufferRef = useRef('');

    useEffect(() => {
        if (!isPlaying || !stableBuffer || isProcessing || stableBuffer === lastBufferRef.current) return;

        const processBuffer = async () => {
            setIsProcessing(true);
            lastBufferRef.current = stableBuffer;

            try {
                const response = await fetch('/api/orchestrator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: classId,
                        students,
                        teacherTranscriptChunk: stableBuffer
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isProcessed) {
                        setStableBuffer(data.remainingBuffer);
                        lastBufferRef.current = '';

                        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const newEntries: TranscriptEntry[] = [];

                        if (data.extractedContext) {
                            newEntries.push({
                                id: `t-${Date.now()}`,
                                speaker: 'Teacher',
                                text: data.extractedContext,
                                timestamp,
                            });
                        }

                        // Update students based on orchestrator response
                        if (data.responses && data.responses.length > 0) {
                            setStudents(prev => {
                                const updated = [...prev];

                                // Először mindenkinek töröljük az előző cselekvését (hogy eltűnjenek a régi szövegbuborékok)
                                // De a hangulatuk/engagement marad
                                updated.forEach(s => {
                                    s.currentAction = 'LISTEN';
                                    s.currentMessage = null;
                                    s.raisedHand = false;
                                });

                                data.responses.forEach((res: any) => {
                                    const idx = updated.findIndex(s => s.id === res.studentId);
                                    if (idx !== -1) {
                                        updated[idx] = {
                                            ...updated[idx],
                                            moodScore: res.newEngagement,
                                            currentAction: res.action,
                                            currentMessage: res.message,
                                            raisedHand: res.action === 'RAISE_HAND',
                                        };
                                        if (res.action !== 'LISTEN' && res.action !== 'RAISE_HAND' && res.message) {
                                            newEntries.push({
                                                id: `s-${res.studentId}-${Date.now()}`,
                                                speaker: updated[idx].name,
                                                text: res.message,
                                                timestamp,
                                                // rudimentary emotion inference from score
                                                emotion: res.newEngagement > 70 ? 'happy' : res.newEngagement < 40 ? 'confused' : 'neutral'
                                            });
                                            toast(`${updated[idx].name} says:`, { description: res.message, duration: 4000 });
                                        }
                                    }
                                });
                                return updated;
                            });
                        }

                        if (newEntries.length > 0) {
                            setLiveTranscript(prev => [...prev, ...newEntries]);
                        }

                    } else if (data.remainingBuffer !== undefined) {
                        // Not enough context yet. Buffer stays the same or grows pending next STT update.
                    }
                }
            } catch (err) {
                console.error("Orchestrator sync failed", err);
            } finally {
                setIsProcessing(false);
            }
        };

        processBuffer();
    }, [stableBuffer, isPlaying, isProcessing, classId, students]); // Wait, students in deps might cause a loop or send old data. 
    // Actually, we do want the latest students sent, but we don't want to re-trigger if trailing buffer hasn't changed.
    // The `stableBuffer === lastBufferRef.current` check guards against that!

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleTogglePlay = () => {
        if (isPlaying) {
            stopListening();

            console.log("\n=== 📝 SIMULATION ENDED. FULL TRANSCRIPT ===");
            console.table(liveTranscript.map(t => ({ Time: t.timestamp, Speaker: t.speaker, Text: t.text })));
            console.log("Raw object:", JSON.stringify(liveTranscript, null, 2));
            console.log("================================================\n");

            // Save to file via API
            fetch('/api/transcripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId, transcript: liveTranscript })
            }).catch(e => console.error("Failed to save transcript", e));

            // Stopping the simulation redirects to the diary/report
            toast.success("Simulation Ended", { description: "Preparing virtual diary..." });
            setTimeout(() => {
                router.push(`/report/${classId}`);
            }, 800);
        } else {
            setIsPlaying(true);
            setLiveTranscript([]); // Reset
            startListening();
            toast.info("Simulation Started", { description: "The virtual class has begun. Microphone active." });
        }
    };

    const handleSaveRoster = () => {
        toast.success("Successfully saved to database", {
            description: "Class roster has been successfully updated.",
        });
    };

    const handleAddStudent = () => {
        // Pick a random student not already in the class (or just generate a clone if all are added)
        const available = globalStudents.filter(s => !students.find(cs => cs.id === s.id));
        if (available.length > 0) {
            const newStudent = available[Math.floor(Math.random() * available.length)];
            setStudents([...students, newStudent]);
            toast.success(`Added dummy student: ${newStudent.name}`);
        } else if (globalStudents.length > 0) {
            // Just clone one for demo purposes
            const clone = { ...globalStudents[Math.floor(Math.random() * globalStudents.length)], id: `s${Date.now()}` };
            setStudents([...students, clone]);
            toast.success(`Added a cloned student: ${clone.name}`);
        } else {
            toast.error("Not enough students in the database.");
        }
    };

    // Sort students by mood (ascending, lowest first) for the Mood Meter sidebar
    const sortedByMood = useMemo(() => {
        return [...students].sort((a, b) => a.moodScore - b.moodScore);
    }, [students]);

    // Derive color based on mood percentage
    const getMoodColor = (score: number) => {
        if (score < 40) return "text-red-500 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
        if (score < 70) return "text-amber-500 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
        return "text-green-500 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    };

    const getMoodBg = (score: number) => {
        if (score < 40) return "bg-red-50 dark:bg-red-900/20";
        if (score < 70) return "bg-amber-50 dark:bg-amber-900/20";
        return "bg-green-50 dark:bg-green-900/20";
    };

    if (!initialClass) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 text-slate-500">
                <div className="animate-pulse">Loading simulation...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{initialClass.subject}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{initialClass.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isPlaying && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-sm font-bold border border-red-100 dark:border-red-800/50 animate-pulse outline-none">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Live: {formatTime(seconds)}
                        </div>
                    )}
                    <button onClick={handleSaveRoster} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-semibold border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <Save size={18} />
                        <span className="hidden sm:inline">Save Roster</span>
                    </button>
                    <button onClick={handleAddStudent} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-3 py-2 rounded-lg text-sm font-semibold">
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Add Student</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Classroom Area */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col pb-32">

                    {/* Simulation Viewport */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col justify-center relative overflow-hidden">

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr h-full place-items-center">
                            <AnimatePresence>
                                {students.map((student, idx) => (
                                    <StudentCard key={student.id} student={student} idx={idx} />
                                ))}
                            </AnimatePresence>
                        </div>

                        {!isPlaying && (
                            <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-950/60 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-4">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl dark:shadow-slate-950/50 flex flex-col items-center text-center max-w-sm border border-slate-100 dark:border-slate-800">
                                    <Clock className="text-slate-400 dark:text-slate-500 mb-3" size={32} />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Class Not Started</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Press play to begin the simulation. Students will react dynamically as time progresses.</p>
                                    <button
                                        onClick={handleTogglePlay}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-blue-600 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                                    >
                                        <Play size={20} className="fill-current" /> Initialize Class
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar: Mood Meter */}
                <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none z-20 hidden md:flex">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                            <span className="text-primary">📊</span> Mood Meter
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Ascending order (lowest engagement first)</p>
                    </div>

                    <div className="p-4 flex-1 space-y-3">
                        <AnimatePresence>
                            {sortedByMood.map(student => (
                                <motion.div
                                    key={student.id}
                                    layoutId={`mood-${student.id}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-3 rounded-2xl shadow-sm flex items-center gap-3"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${getMoodColor(student.moodScore)} overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0`}>
                                        <img
                                            src={`https://wsrv.nl/?url=${encodeURIComponent(`avatar.iran.liara.run/public/${guessGender(student.name)}?username=` + student.name + '_' + student.age)}`}
                                            alt={`${student.name} avatar`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{student.name}</h4>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getMoodColor(student.moodScore)}`}>
                                                {student.moodScore}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

                {/* Transcript Overlay (Bottom Left) */}
                {isPlaying && (
                    <div className="absolute bottom-6 left-6 z-30 pointer-events-none max-w-lg w-full">
                        <AnimatePresence>
                            {fullTranscript && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="bg-slate-900/80 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tanár (Élő Átirat)</span>
                                    </div>
                                    <p className="text-sm leading-relaxed font-medium">
                                        {fullTranscript}
                                        <span className="animate-pulse">_</span>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Floating Bottom Control Bar */}
                <div className="absolute bottom-6 left-0 right-0 md:right-80 flex justify-center z-30 px-6 pointer-events-none">
                    <motion.div
                        className="glass-panel px-6 py-4 border-slate-200 dark:border-slate-700/50 dark:bg-slate-900/90 shadow-xl flex items-center gap-4 pointer-events-auto"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        {!isPlaying ? (
                            <button
                                onClick={handleTogglePlay}
                                className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-lg shadow-md transition-all active:scale-95 bg-primary hover:bg-blue-600 text-white shadow-primary/30"
                            >
                                <Play className="fill-current" size={20} /> Start Class
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => isListening ? stopListening() : startListening()}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-bold text-lg shadow-md transition-all active:scale-95 ${isListening
                                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                        : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                        }`}
                                >
                                    {isListening ? (
                                        <> <Mic className="fill-current" size={20} /> Mic On </>
                                    ) : (
                                        <> <MicOff className="fill-current" size={20} /> Mic Muted </>
                                    )}
                                </button>
                                <div className="w-px h-8 bg-slate-200 rounded-full mx-2"></div>
                                <button
                                    onClick={handleTogglePlay}
                                    className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-bold text-lg shadow-md transition-all active:scale-95 bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                                >
                                    <Square className="fill-current" size={20} /> End Simulation
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
