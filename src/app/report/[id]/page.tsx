'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { mockTranscript, mockAIFeedback } from '@/lib/mockData';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Download, Save, CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, PenLine, RefreshCcw, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { TranscriptEntry } from '@/types/shared';

export default function VirtualDiary() {
    const params = useParams();
    const router = useRouter();
    const { classes } = useStore();
    const classId = params.id as string;
    const currentClass = classes.find(c => c.id === classId);

    // If classes are empty or not found, fallback to loading or safe defaults safely
    // (A real app would fetch here if empty)

    const reportRef = useRef<HTMLDivElement>(null);
    const [notes, setNotes] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isGuest, setIsGuest] = useState(true); // default: treat as guest until resolved
    const [authChecked, setAuthChecked] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>(mockTranscript);
    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

    // AI Feedback State
    const [aiFeedback, setAiFeedback] = useState<{ wentWell: string[], toImprove: string[], suggestions: string[] } | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    // Statistics State
    const [sessionStats, setSessionStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // Check Supabase auth state on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                setIsGuest(!user);
            } catch {
                setIsGuest(true);
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, []);

    // Handle ESC key to "jump out" to dashboard
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.push('/dashboard');
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [router]);

    const handleSaveReport = async () => {
        if (isGuest) {
            toast.error("Not logged in", {
                description: "Please log in to save the report.",
            });
            return;
        }

        try {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Please log in again.");
            }

            const { error: dbError } = await supabase
                .from('class_transcripts')
                .insert([{
                    user_id: user.id,
                    class_id: classId,
                    transcript: transcript,
                    notes: notes
                }]);

            if (dbError) throw dbError;

            // Also save structured session statistics if they were computed
            if (sessionStats) {
                const { data: sessionData, error: sessionError } = await supabase
                    .from('class_sessions')
                    .insert([{
                        class_id: classId,
                        user_id: user.id,
                        duration_seconds: sessionStats.duration_seconds,
                        average_satisfaction: sessionStats.average_satisfaction,
                    }])
                    .select('id')
                    .single();

                if (!sessionError && sessionData) {
                    const sessionId = sessionData.id;

                    if (sessionStats.studentStats && sessionStats.studentStats.length > 0) {
                        const studentInserts = sessionStats.studentStats.map((s: any) => ({
                            session_id: sessionId,
                            student_id: s.student_id,
                            student_name: s.student_name,
                            average_satisfaction: s.average_satisfaction
                        }));
                        await supabase.from('student_session_stats').insert(studentInserts);
                    }

                    if (sessionStats.timeline && sessionStats.timeline.length > 0) {
                        const baseTime = Date.now() - (sessionStats.duration_seconds * 1000);
                        const timelineInserts = sessionStats.timeline.map((t: any, idx: number) => {
                            const eventTime = new Date(baseTime + (idx * 60000));
                            return {
                                session_id: sessionId,
                                student_id: 'class_average',
                                mood_score: t.average_satisfaction,
                                recorded_at: eventTime.toISOString()
                            };
                        });
                        await supabase.from('satisfaction_events').insert(timelineInserts);
                    }
                }
            }

            toast.success("Successfully saved to database", {
                description: "The class transcript and notes have been saved to your profile.",
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("Hiba történt a mentés során", {
                description: error.message || "Ismeretlen hiba.",
            });
        }
    };

    const handleLoadLiveTranscript = async () => {
        setIsLoadingTranscript(true);
        setIsLoadingStats(true);
        try {
            const res = await fetch(`/api/transcripts?classId=${classId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.transcript && data.transcript.length > 0) {
                    setTranscript(data.transcript);
                    toast.success("Live transcript loaded successfully!");

                    // Generate AI Feedback based on transcript
                    await generateAIFeedback(data.transcript);

                    // Compute Live Class Statistics from Transcript
                    const emotionToScore = (emotion?: string) => {
                        if (emotion === 'happy') return 90;
                        if (emotion === 'excited') return 95;
                        if (emotion === 'neutral') return 60;
                        if (emotion === 'confused') return 30;
                        if (emotion === 'anxious') return 20;
                        if (emotion === 'bored') return 20;
                        return null;
                    };

                    const timelineMap = new Map<string, { total: number, count: number }>();
                    const studentStatsMap = new Map<string, { total: number, count: number, max: number, min: number }>();

                    let firstTimeMs = 0;
                    let lastTimeMs = 0;

                    data.transcript.forEach((entry: TranscriptEntry, idx: number) => {
                        const timeMatch = entry.timestamp.match(/(\d+):(\d+)\s*(AM|PM)/i);
                        let timeMs = Date.now();
                        if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const mins = parseInt(timeMatch[2]);
                            const ampm = timeMatch[3].toUpperCase();
                            if (ampm === 'PM' && hours < 12) hours += 12;
                            if (ampm === 'AM' && hours === 12) hours = 0;
                            const d = new Date();
                            d.setHours(hours, mins, 0, 0);
                            timeMs = d.getTime();
                        }
                        if (idx === 0) firstTimeMs = timeMs;
                        lastTimeMs = timeMs;

                        if (entry.emotion) {
                            const score = emotionToScore(entry.emotion);
                            if (score !== null) {
                                const minuteKey = entry.timestamp;
                                if (!timelineMap.has(minuteKey)) timelineMap.set(minuteKey, { total: 0, count: 0 });
                                timelineMap.get(minuteKey)!.total += score;
                                timelineMap.get(minuteKey)!.count += 1;

                                const studentEntry = studentStatsMap.get(entry.speaker);
                                if (!studentEntry) {
                                    studentStatsMap.set(entry.speaker, { total: score, count: 1, max: score, min: score });
                                } else {
                                    studentEntry.total += score;
                                    studentEntry.count += 1;
                                    if (score > studentEntry.max) studentEntry.max = score;
                                    if (score < studentEntry.min) studentEntry.min = score;
                                }
                            }
                        }
                    });

                    const timeline = Array.from(timelineMap.entries()).map(([minute, stats]) => ({
                        minute,
                        average_satisfaction: Math.round(stats.total / stats.count)
                    }));

                    const studentStats = Array.from(studentStatsMap.entries()).map(([name, stats]) => ({
                        student_id: name,
                        student_name: name,
                        average_satisfaction: Math.round(stats.total / stats.count),
                        max_satisfaction: stats.max,
                        min_satisfaction: stats.min
                    })).sort((a, b) => b.average_satisfaction - a.average_satisfaction);

                    let durationSeconds = Math.round((lastTimeMs - firstTimeMs) / 1000);
                    if (durationSeconds <= 0) durationSeconds = 60 * timeline.length;

                    if (timeline.length > 0) {
                        setSessionStats({
                            duration_seconds: durationSeconds,
                            timeline,
                            studentStats,
                            average_satisfaction: Math.round(timeline.reduce((acc, t) => acc + t.average_satisfaction, 0) / timeline.length)
                        });
                    }
                } else {
                    toast.info("No live transcript found for this session.", { description: "Showing mock data instead." });
                }
            } else {
                toast.error("Failed to load live transcript.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Connection error while loading transcript.");
        } finally {
            setIsLoadingTranscript(false);
            setIsLoadingStats(false);
        }
    };

    const generateAIFeedback = async (transcriptData: TranscriptEntry[]) => {
        setIsGeneratingFeedback(true);
        const toastId = toast.loading("🤖 Szimuláció elemzése és AI Coach értékelés készítése...");
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcriptData })
            });

            if (!res.ok) throw new Error("Failed to fetch AI feedback");

            const data = await res.json();
            if (data.feedback) {
                setAiFeedback(data.feedback);
                toast.success("AI Coach elkészült az elemzéssel!", { id: toastId });
            } else {
                throw new Error("Invalid response format");
            }

        } catch (error) {
            console.error(error);
            toast.error("Hiba az AI értékelés generálása közben.", { id: toastId });
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        try {
            setIsExporting(true);
            toast.info("Generating PDF...", { id: 'pdf-toast', duration: 10000 });

            // Allow UI to update
            await new Promise(r => setTimeout(r, 100));

            const element = reportRef.current;

            // html-to-image handles oklch natively because it lets the browser render the DOM into an SVG foreignObject
            const imgData = await toPng(element, {
                cacheBust: true,
                pixelRatio: 2,
                fontEmbedCSS: '' // Use existing loaded fonts
            });

            // Calculate PDF dimensions (using scaled sizes since pixelRatio is 2)
            const width = element.offsetWidth * 2;
            const height = element.offsetHeight * 2;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [width, height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Class_Report_${(currentClass?.subject || 'report').replace(/[^a-z0-9]/gi, '_')}.pdf`);

            toast.success("PDF Downloaded successfully!", { id: 'pdf-toast' });
        } catch (error: any) {
            console.error('PDF Export Error:', error);
            toast.error("Failed to generate PDF.", { id: 'pdf-toast', description: error?.message || "An unexpected error occurred." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
            {/* Top Navbar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link href={`/class/${classId}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">Virtual Diary</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Post-Class Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-indigo-700 disabled:opacity-50"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Download PDF'}</span>
                    </button>

                    <button
                        onClick={handleSaveReport}
                        disabled={authChecked && isGuest}
                        title={isGuest ? 'Log in to save your report' : 'Save report to your profile'}
                        className={`flex items-center gap-2 transition-colors px-4 py-2 rounded-lg text-sm font-bold shadow-md ${authChecked && isGuest
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-primary text-white hover:bg-blue-600 shadow-primary/20'
                            }`}
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">{authChecked && isGuest ? 'Login required' : 'Save Report'}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6">

                {/* Action Guard for Guest Users — only shown when confirmed not logged in */}
                {authChecked && isGuest && (
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={20} />
                        <div>
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300">Guest Mode Active</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                                Log in to save this report permanently to your profile.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- PDF CONTENT WRAPPER --- */}
                <div ref={reportRef} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">

                    {/* Header Info */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 text-center sm:text-left">
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">{currentClass?.subject || 'Beszámoló'}</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><span className="text-lg">{currentClass?.emoji || '📚'}</span> {currentClass?.name || 'Ismeretlen Osztály'}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{currentClass?.students?.length || 0} Students</span>
                            {sessionStats?.durationSeconds && (
                                <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/50">
                                    <Clock size={16} />
                                    {Math.floor(sessionStats.durationSeconds / 60)} perc {sessionStats.durationSeconds % 60} mp
                                </span>
                            )}
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Class Statistics Overview - Recharts */}
                    {sessionStats && (
                        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Most/Least Satisfied */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-5 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">Most Satisfied</p>
                                        <p className="text-slate-900 dark:text-slate-100 font-bold">
                                            {sessionStats.studentStats?.[0]?.student_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400 font-bold">
                                            {sessionStats.studentStats?.[0]?.max_satisfaction ?? sessionStats.studentStats?.[0]?.average_satisfaction ?? 0}% peak satisfaction
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 p-5 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-800/50 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
                                        <TrendingDown size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-1">Least Satisfied</p>
                                        <p className="text-slate-900 dark:text-slate-100 font-bold">
                                            {sessionStats.studentStats?.[sessionStats.studentStats.length - 1]?.student_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">
                                            {sessionStats.studentStats?.[sessionStats.studentStats.length - 1]?.min_satisfaction ?? sessionStats.studentStats?.[sessionStats.studentStats.length - 1]?.average_satisfaction ?? 0}% lowest satisfaction
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Chart */}
                            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 p-6 rounded-2xl flex flex-col">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" />
                                    Osztály elégedettség alakulása
                                </h3>
                                <div className="flex-1 w-full min-h-[180px]">
                                    {sessionStats.timeline && sessionStats.timeline.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={sessionStats.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                                <XAxis dataKey="minute" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-white, #fff)', color: '#0f172a' }}
                                                    labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                                                />
                                                <Area type="monotone" dataKey="average_satisfaction" name="Class Satisfaction" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSatisfaction)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                                            Nincs elegendő adat a grafikonhoz
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Teacher Notes Area */}
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <PenLine size={20} className="text-primary" /> Teacher Notes
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What methodology did you try? Observations? Self-reflection?"
                                className="w-full h-40 md:h-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        {/* AI Feedback Cards */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <SparklesIcon /> AI Coach Feedback
                                </h3>
                                {isGeneratingFeedback && <span className="text-xs font-semibold text-primary animate-pulse">Generating...</span>}
                            </div>

                            {!aiFeedback && !isGeneratingFeedback ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 h-full flex flex-col justify-center items-center">
                                    <Lightbulb size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Use &quot;Load Live Transcript&quot; to fetch your simulation data and generate your AI Coach feedback.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/40 rounded-2xl p-4 transition-all" style={{ opacity: isGeneratingFeedback ? 0.5 : 1 }}>
                                        <h4 className="text-green-800 dark:text-green-300 font-bold flex items-center gap-2 mb-2 text-sm"><CheckCircle2 size={16} /> What Went Well</h4>
                                        <ul className="text-sm text-green-700 dark:text-green-400 space-y-1 pl-6 list-disc marker:text-green-300">
                                            {aiFeedback ? aiFeedback.wentWell.map((fb, i) => <li key={i}>{fb}</li>) : <li>Loading...</li>}
                                        </ul>
                                    </div>

                                    <div className="bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4 transition-all" style={{ opacity: isGeneratingFeedback ? 0.5 : 1 }}>
                                        <h4 className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-2 mb-2 text-sm"><AlertCircle size={16} /> Areas to Consider</h4>
                                        <ul className="text-sm text-rose-700 dark:text-rose-400 space-y-1 pl-6 list-disc marker:text-rose-300">
                                            {aiFeedback ? aiFeedback.toImprove.map((fb, i) => <li key={i}>{fb}</li>) : <li>Loading...</li>}
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4 transition-all" style={{ opacity: isGeneratingFeedback ? 0.5 : 1 }}>
                                        <h4 className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2 mb-2 text-sm"><Lightbulb size={16} /> Suggested Approaches</h4>
                                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 pl-6 list-disc marker:text-blue-300">
                                            {aiFeedback ? aiFeedback.suggestions.map((fb, i) => <li key={i}>{fb}</li>) : <li>Loading...</li>}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Transcript Section */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Class Transcript</h3>
                            <button
                                onClick={handleLoadLiveTranscript}
                                disabled={isLoadingTranscript}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                <RefreshCcw size={16} className={isLoadingTranscript ? 'animate-spin' : ''} />
                                {isLoadingTranscript ? 'Loading...' : 'Load Live Transcript'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {transcript.length > 0 ? transcript.map((entry, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={entry.id}
                                    className={`flex flex-col ${entry.speaker === 'Teacher' ? 'items-end' : 'items-start'}`}
                                >
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 px-2 uppercase tracking-wider">
                                        {entry.speaker} • {entry.timestamp}
                                    </span>

                                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed
                    ${entry.speaker === 'Teacher'
                                            ? 'bg-primary text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                        }
                  `}>
                                        {entry.text}
                                    </div>

                                    {/* Emotion/Reaction tag for students */}
                                    {entry.speaker !== 'Teacher' && entry.emotion && (
                                        <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full border opacity-80
                        ${entry.emotion === 'happy' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                        ${entry.emotion === 'confused' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : ''}
                        ${entry.emotion === 'neutral' ? 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : ''}
                     `}>
                                            Reacted: {entry.emotion}
                                        </span>
                                    )}
                                </motion.div>
                            )) : (
                                <p className="text-slate-500 dark:text-slate-400 italic text-center py-8">No conversation recorded during this class.</p>
                            )}
                        </div>
                    </div>

                </div>
                {/* --- END PDF CONTENT WRAPPER --- */}

            </main>
        </div>
    );
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    );
}
