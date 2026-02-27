'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { VirtualClass, Student } from '@/types/shared';
import { Users, Plus, X, BookOpen, Clock, Activity, Search, PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesPage() {
    const { classes, students, addClass, setClasses, setStudents } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    // Fetch classes and students on mount
    useEffect(() => {
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
                    setStudents(data.students);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error('Hiba történt az adatok betöltésekor.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [setClasses, setStudents]);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'view' | 'create'>('view');
    const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null);

    // Search and filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setSearchResults(students);
    }, [students]);

    useEffect(() => {
        const handleSearch = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/students?q=${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.students);
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(handleSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

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
        setSearchQuery('');
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    // Auto-open drawer if ?action=new is in URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('action') === 'new') {
                openCreateDrawer();
                // Clean up URL to prevent re-opening on manual refresh
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [students.length, classes.length]); // Wait for initial data load to be safe

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

    const [isGenerating, setIsGenerating] = useState(false);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newSubject) return;

        setIsGenerating(true);
        const classStudents = students.filter(s => selectedStudentIds.has(s.id));

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    subject: newSubject,
                    emoji: newEmoji,
                    description: 'Custom created class.',
                    students: classStudents,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create class');
            }

            const { virtualClass: newClass } = await response.json();

            addClass(newClass);
            toast.success('Osztály sikeresen mentve!', {
                description: `${newName} added to your active cohorts.`,
            });
            closeDrawer();
        } catch (error: any) {
            console.error("Failed to save class:", error);
            toast.error('Hiba történt a mentés során.', {
                description: error.message,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative mx-auto max-w-5xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Virtual Classrooms</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your active classes and simulation environments.</p>
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
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-sky-400" />
                </div>
            ) : classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p>No classes created yet.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((vClass) => (
                        <button
                            key={vClass.id}
                            onClick={() => openViewDrawer(vClass)}
                            className="group relative flex flex-col items-start overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 p-6 text-left shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-primary/20 dark:hover:ring-sky-500/30"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-900/30 text-4xl shadow-sm transition-transform group-hover:scale-105">
                                {vClass.emoji}
                            </div>
                            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{vClass.name}</h3>
                            <div className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <BookOpen size={14} className="text-primary dark:text-sky-400" />
                                {vClass.subject}
                            </div>

                            <div className="mt-auto flex w-full items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Users size={16} className="text-slate-400 dark:text-slate-500" />
                                    <span className="font-semibold text-slate-900 dark:text-slate-200">{vClass.students?.length || 0}</span> Students
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Slide-over Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/20 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
                    onClick={closeDrawer}
                />
            )}

            {/* Slide-over Drawer Panel */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50 border-l border-transparent dark:border-slate-800/50 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {drawerMode === 'view' ? 'Class Details' : 'Create New Class'}
                    </h2>
                    <button
                        onClick={closeDrawer}
                        className="rounded-full p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {drawerMode === 'view' && selectedClass && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-900/40 text-5xl">
                                    {selectedClass.emoji}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedClass.name}</h3>
                                    <p className="font-medium text-primary dark:text-sky-400">{selectedClass.subject}</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400">{selectedClass.description}</p>

                            {/* Mock Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-4">
                                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Activity size={14} /> Avg. Engagement</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">88%</div>
                                </div>
                                <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-4">
                                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock size={14} /> Total Hours</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">12.5h</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Roster ({selectedClass.students?.length || 0})</h4>
                                <div className="space-y-2">
                                    {(selectedClass.students || []).map(student => (
                                        <div key={student.id} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-xl">
                                                {student.emoji}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{student.type}</div>
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
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Class Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. 10th Grade Honors"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary dark:focus:border-sky-500 focus:ring-2 focus:ring-primary/20 dark:focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Subject / Era</label>
                                    <input
                                        required
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="e.g. Chemistry: Thermodynamics"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary dark:focus:border-sky-500 focus:ring-2 focus:ring-primary/20 dark:focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Class Emoji</label>
                                    <input
                                        required
                                        type="text"
                                        value={newEmoji}
                                        onChange={(e) => setNewEmoji(e.target.value)}
                                        className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 text-center text-xl outline-none transition-all focus:border-primary dark:focus:border-sky-500 focus:ring-2 focus:ring-primary/20 dark:focus:ring-sky-500/20"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200">Select Students</label>
                                    <span className="text-xs font-medium text-primary dark:text-sky-400">{selectedStudentIds.size} selected</span>
                                </div>
                                <div className="mb-4 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter personas..."
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-2 pl-9 pr-4 text-sm outline-none transition-colors dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-primary dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                                    />
                                </div>

                                <div className="h-[240px] space-y-2 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 p-2 relative">
                                    {isSearching && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary dark:text-sky-400" />
                                        </div>
                                    )}
                                    {searchResults.map(student => {
                                        const isSelected = selectedStudentIds.has(student.id);
                                        return (
                                            <button
                                                type="button"
                                                key={student.id}
                                                onClick={() => toggleStudentSelection(student.id)}
                                                className={`flex w-full items-center justify-between rounded-lg p-3 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-sky-900/30 ring-1 ring-primary/30 dark:ring-sky-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{student.emoji}</span>
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</span>
                                                    {student.condition && (
                                                        <span className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                                                            {student.condition}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-primary dark:border-sky-500 bg-primary dark:bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-600'
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
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900 mt-auto">
                    {drawerMode === 'create' ? (
                        <button
                            type="submit"
                            form="create-class-form"
                            disabled={isGenerating}
                            className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Class'}
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
