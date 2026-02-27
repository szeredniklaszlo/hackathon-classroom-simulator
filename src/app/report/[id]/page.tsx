'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { mockTranscript, mockAIFeedback, mockClasses } from '@/lib/mockData';
import { toast } from 'sonner';
import { Download, Save, CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, PenLine } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Link from 'next/link';

export default function VirtualDiary() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;
    const currentClass = mockClasses.find(c => c.id === classId) || mockClasses[0];

    const reportRef = useRef<HTMLDivElement>(null);
    const [notes, setNotes] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleSaveReport = () => {
        toast.success("Sikeres mentés az adatbázisba", {
            description: "Class report and notes have been saved.",
        });
        // In actual app, redirect to dashboard. Let's just go to dashboard after a delay.
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        try {
            setIsExporting(true);
            toast.info("Generating PDF...");

            // Small delay to allow react to render any loading state
            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Class_Report_${currentClass.subject.replace(/[^a-z0-9]/gi, '_')}.pdf`);

            toast.success("PDF Downloaded successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF.", { description: "An unexpected error occurred." });
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
                        className="flex items-center gap-2 bg-primary text-white hover:bg-blue-600 transition-colors px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20"
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">Save Report</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6">

                {/* Action Guard for Guest Users */}
                <div className="mb-6 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={20} />
                    <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">Guest Mode Active</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Log in to save this data permanently to your database profile. Saving now will only simulate the process.</p>
                    </div>
                </div>

                {/* --- PDF CONTENT WRAPPER --- */}
                <div ref={reportRef} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">

                    {/* Header Info */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 text-center sm:text-left">
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">{currentClass.subject}</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><span className="text-lg">{currentClass.emoji}</span> {currentClass.name}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{currentClass.students.length} Students</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

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
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <SparklesIcon /> AI Coach Feedback
                            </h3>

                            <div className="bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/40 rounded-2xl p-4">
                                <h4 className="text-green-800 dark:text-green-300 font-bold flex items-center gap-2 mb-2 text-sm"><CheckCircle2 size={16} /> What Went Well</h4>
                                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1 pl-6 list-disc marker:text-green-300">
                                    {mockAIFeedback.wentWell.map((fb, i) => <li key={i}>{fb}</li>)}
                                </ul>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4">
                                <h4 className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-2 mb-2 text-sm"><AlertCircle size={16} /> Areas to Consider</h4>
                                <ul className="text-sm text-rose-700 dark:text-rose-400 space-y-1 pl-6 list-disc marker:text-rose-300">
                                    {mockAIFeedback.toImprove.map((fb, i) => <li key={i}>{fb}</li>)}
                                </ul>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4">
                                <h4 className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2 mb-2 text-sm"><Lightbulb size={16} /> Suggested Approaches</h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 pl-6 list-disc marker:text-blue-300">
                                    {mockAIFeedback.suggestions.map((fb, i) => <li key={i}>{fb}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Transcript Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 pt-6 border-t border-slate-100 dark:border-slate-800">Class Transcript</h3>
                        <div className="space-y-4">
                            {mockTranscript.map((entry, idx) => (
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
                            ))}
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
