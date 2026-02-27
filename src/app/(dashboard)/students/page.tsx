'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Student, StudentType } from '@/types/shared';
import { UserPlus, X, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentsPage() {
    const { students, addStudent } = useStore();

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('🧐');
    const [activityLevel, setActivityLevel] = useState(50);
    const [conflictLevel, setConflictLevel] = useState(20);
    const [attentionSpan, setAttentionSpan] = useState(50);

    const openCreateDrawer = () => {
        setNewName('');
        setNewEmoji('🧠');
        setActivityLevel(50);
        setConflictLevel(20);
        setAttentionSpan(50);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
    };

    // Calculate generic type based on sliders (Mock AI logic)
    const determineStudentType = (): StudentType => {
        if (conflictLevel > 70) return 'Class Clown';
        if (attentionSpan < 30) return 'Easily Distracted';
        if (activityLevel > 70 && attentionSpan > 70) return 'Fast Learner';
        if (conflictLevel < 30 && attentionSpan > 70) return 'Deep Thinker';
        if (activityLevel < 30) return 'Anxious Achiever';
        return 'ESL Student'; // fallback
    };

    const handleGenerateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const newStudent: Student = {
            id: `s_${Date.now()}`,
            name: newName,
            age: 15,
            type: determineStudentType(),
            emoji: newEmoji,
            moodScore: 50 + Math.floor(Math.random() * 30), // random starting mood 50-80
            raisedHand: false,
            learningStatus: 'Awaiting first lesson...',
            struggles: conflictLevel > 60 ? 'Authority and rules.' : 'Needs continuous motivation.',
        };

        addStudent(newStudent);
        toast.success('Diák sikeresen generálva!', {
            description: `${newName} added to the persona pool.`,
        });
        closeDrawer();
    };

    return (
        <div className="relative mx-auto max-w-5xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Personas</h1>
                    <p className="mt-1 text-slate-500">Manage and create AI-driven student profiles.</p>
                </div>
                <button
                    onClick={openCreateDrawer}
                    className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow-md active:scale-95"
                >
                    <Sparkles size={18} />
                    Generate Persona
                </button>
            </div>

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => (
                    <div
                        key={student.id}
                        className="group flex flex-col items-start overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-sm">
                                {student.emoji}
                            </div>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                {student.type}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                            <p className="text-sm font-medium text-slate-500">{student.age} years old</p>
                        </div>

                        <div className="mt-4 w-full rounded-xl bg-slate-50 p-3 text-sm">
                            <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                <AlertCircle size={14} className="text-amber-500" />
                                Known Struggles
                            </div>
                            <p className="text-slate-600 line-clamp-2">{student.struggles}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slide-over Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                    onClick={closeDrawer}
                />
            )}

            {/* Slide-over Drawer Panel */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-indigo-500" size={20} />
                        <h2 className="text-xl font-bold text-slate-900">
                            Generate Persona
                        </h2>
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="generate-student-form" onSubmit={handleGenerateStudent} className="space-y-8">

                        {/* Basic Info */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-900">Student Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Liam"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-900">Emoji</label>
                                <input
                                    required
                                    type="text"
                                    value={newEmoji}
                                    onChange={(e) => setNewEmoji(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xl outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Personality Sliders */}
                        <div className="space-y-6 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-5">
                            <div>
                                <h3 className="text-sm font-bold text-indigo-900 mb-1">Personality Configuration</h3>
                                <p className="text-xs text-slate-500 mb-4">Adjust the sliders to shape the AI agent's behavior during class simulations.</p>
                            </div>

                            {/* Activity Level */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-500">Passive</span>
                                    <span className="text-indigo-600">Activity Level</span>
                                    <span className="text-slate-500">Hyperactive</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 rounded-full outline-none accent-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            {/* Conflict Level */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-emerald-500">Peaceful</span>
                                    <span className="text-indigo-600">Conflict Level</span>
                                    <span className="text-rose-500">Chaotic</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={conflictLevel}
                                    onChange={(e) => setConflictLevel(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 rounded-full outline-none accent-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            {/* Attention Span */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-amber-500">Easily Distracted</span>
                                    <span className="text-indigo-600">Attention Span</span>
                                    <span className="text-blue-500">Laser Focus</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={attentionSpan}
                                    onChange={(e) => setAttentionSpan(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 rounded-full outline-none accent-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 p-6 bg-slate-50 mt-auto">
                    <button
                        type="submit"
                        form="generate-student-form"
                        className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-500 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow-md active:scale-[0.98]"
                    >
                        <Sparkles size={18} />
                        Generate AI Persona
                    </button>
                    <p className="mt-3 text-center text-xs text-slate-400">
                        This immediately creates a prompt context for the LLM.
                    </p>
                </div>
            </div>
        </div>
    );
}
