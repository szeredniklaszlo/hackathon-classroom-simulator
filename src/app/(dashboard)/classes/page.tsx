'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { VirtualClass, Student } from '@/types/shared';
import { Users, Plus, X, BookOpen, Clock, Activity, Search, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesPage() {
    const { classes, students, addClass } = useStore();

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'view' | 'create'>('view');
    const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null);

    // Form State for creating a class
    const [newName, setNewName] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newEmoji, setNewEmoji] = useState('🎓');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const openViewDrawer = (vClass: VirtualClass) => {
        setSelectedClass(vClass);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const openCreateDrawer = () => {
        setNewName('');
        setNewSubject('');
        setNewEmoji('🎓');
        setSelectedStudentIds(new Set());
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        // Delay clearing state to allow close animation
        setTimeout(() => setSelectedClass(null), 300);
    };

    const toggleStudentSelection = (id: string) => {
        const next = new Set(selectedStudentIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStudentIds(next);
    };

    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newSubject) return;

        const classStudents = students.filter(s => selectedStudentIds.has(s.id));

        const newClass: VirtualClass = {
            id: `c_${Date.now()}`,
            name: newName,
            subject: newSubject,
            emoji: newEmoji,
            description: 'Custom created class.',
            students: classStudents,
        };

        addClass(newClass);
        toast.success('Osztály sikeresen mentve!', {
            description: `${newName} added to your active cohorts.`,
        });
        closeDrawer();
    };

    return (
        <div className="relative mx-auto max-w-5xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cohorts</h1>
                    <p className="mt-1 text-slate-500">Manage your active classes and simulation environments.</p>
                </div>
                <button
                    onClick={openCreateDrawer}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    New Class
                </button>
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((vClass) => (
                    <button
                        key={vClass.id}
                        onClick={() => openViewDrawer(vClass)}
                        className="group relative flex flex-col items-start overflow-hidden rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-primary/20"
                    >
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-4xl shadow-sm transition-transform group-hover:scale-105">
                            {vClass.emoji}
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">{vClass.name}</h3>
                        <div className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <BookOpen size={14} className="text-primary" />
                            {vClass.subject}
                        </div>

                        <div className="mt-auto flex w-full items-center justify-between border-t border-slate-50 pt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users size={16} className="text-slate-400" />
                                <span className="font-semibold">{vClass.students.length}</span> Students
                            </div>
                        </div>
                    </button>
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
                    <h2 className="text-xl font-bold text-slate-900">
                        {drawerMode === 'view' ? 'Class Details' : 'Create New Class'}
                    </h2>
                    <button
                        onClick={closeDrawer}
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {drawerMode === 'view' && selectedClass && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-5xl">
                                    {selectedClass.emoji}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedClass.name}</h3>
                                    <p className="font-medium text-primary">{selectedClass.subject}</p>
                                </div>
                            </div>

                            <p className="text-slate-600">{selectedClass.description}</p>

                            {/* Mock Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="mb-1 text-sm text-slate-500 flex items-center gap-2"><Activity size={14} /> Avg. Engagement</div>
                                    <div className="text-2xl font-bold text-slate-900">88%</div>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="mb-1 text-sm text-slate-500 flex items-center gap-2"><Clock size={14} /> Total Hours</div>
                                    <div className="text-2xl font-bold text-slate-900">12.5h</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-3 font-bold text-slate-900">Roster ({selectedClass.students.length})</h4>
                                <div className="space-y-2">
                                    {selectedClass.students.map(student => (
                                        <div key={student.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-xl">
                                                {student.emoji}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-500">{student.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {drawerMode === 'create' && (
                        <form id="create-class-form" onSubmit={handleCreateClass} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900">Class Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. 10th Grade Honors"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900">Subject / Era</label>
                                    <input
                                        required
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="e.g. Chemistry: Thermodynamics"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900">Class Emoji</label>
                                    <input
                                        required
                                        type="text"
                                        value={newEmoji}
                                        onChange={(e) => setNewEmoji(e.target.value)}
                                        className="w-20 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xl outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-900">Select Students</label>
                                    <span className="text-xs font-medium text-primary">{selectedStudentIds.size} selected</span>
                                </div>
                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter personas..."
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                                    />
                                </div>

                                <div className="h-[240px] space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-2">
                                    {students.map(student => {
                                        const isSelected = selectedStudentIds.has(student.id);
                                        return (
                                            <button
                                                type="button"
                                                key={student.id}
                                                onClick={() => toggleStudentSelection(student.id)}
                                                className={`flex w-full items-center justify-between rounded-lg p-3 transition-colors ${isSelected ? 'bg-blue-50/50 ring-1 ring-primary/30' : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl">
                                                        {student.emoji}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-slate-900">{student.name}</div>
                                                        <div className="text-xs text-slate-500">{student.type}</div>
                                                    </div>
                                                </div>
                                                <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300'
                                                    }`}>
                                                    {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 p-6 bg-slate-50 mt-auto">
                    {drawerMode === 'create' ? (
                        <button
                            type="submit"
                            form="create-class-form"
                            className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                        >
                            Save Class
                        </button>
                    ) : (
                        <a
                            href={`/class/${selectedClass?.id}`}
                            className="flex w-full justify-center items-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                        >
                            <PlayCircle size={18} />
                            Start Simulation
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
