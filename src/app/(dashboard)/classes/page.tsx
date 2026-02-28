'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { VirtualClass, Student } from '@/types/shared';
import { Users, Plus, Minus, X, BookOpen, Clock, Activity, Search, PlayCircle, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StudentAvatar } from '@/components/classroom/StudentAvatar';

export default function ClassesPage() {
    const { classes, students, addClass, removeClass, setClasses, setStudents } = useStore();
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
                toast.error('Error loading data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [setClasses, setStudents]);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'view' | 'create'>('view');
    const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null);

    // Class aggregate stats
    const [overviewStats, setOverviewStats] = useState<{ totalDurationSeconds: number, overallAverageSatisfaction: number, sessionCount: number } | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

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
    const [newEmoji, setNewEmoji] = useState('🏫');
    const [selectedStudentCounts, setSelectedStudentCounts] = useState<Record<string, number>>({});

    // Validation states
    const [nameError, setNameError] = useState('');
    const [subjectError, setSubjectError] = useState('');
    const [studentError, setStudentError] = useState('');

    const openViewDrawer = async (vClass: VirtualClass) => {
        setSelectedClass(vClass);
        setDrawerMode('view');
        setIsDrawerOpen(true);

        // Fetch real stats
        setIsLoadingStats(true);
        try {
            const res = await fetch(`/api/statistics/class-overview?classId=${vClass.id}`);
            if (res.ok) {
                const data = await res.json();
                setOverviewStats(data);
            }
        } catch (e) {
            console.error("Failed to fetch class stats", e);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const openCreateDrawer = () => {
        setNewName('');
        setNewSubject('');
        const randomEmojis = ['🏫', '📚', '🧪', '🎨', '🧬', '🧠', '💻', '🎭', '🎼', '⚽', '🌍', '📐'];
        setNewEmoji(randomEmojis[Math.floor(Math.random() * randomEmojis.length)]);
        setSelectedStudentCounts({});
        setSearchQuery('');
        setNameError('');
        setSubjectError('');
        setStudentError('');
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

    // Handle ESC key to close drawer
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDrawer();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        // Delay clearing state to allow close animation
        setTimeout(() => setSelectedClass(null), 300);
    };

    const toggleStudentSelection = (id: string) => {
        const next = { ...selectedStudentCounts };
        if (next[id]) {
            delete next[id];
        } else {
            next[id] = 1;
        }
        setSelectedStudentCounts(next);
        if (studentError) setStudentError('');
    };

    const updateStudentCount = (e: React.MouseEvent, id: string, delta: number) => {
        e.stopPropagation();
        const next = { ...selectedStudentCounts };
        if (next[id]) {
            const newCount = next[id] + delta;
            if (newCount >= 1) {
                next[id] = newCount;
                setSelectedStudentCounts(next);
            }
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [pendingClass, setPendingClass] = useState<'manual' | 'ai' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClass = async () => {
        if (!selectedClass) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/classes?id=${selectedClass.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete class');
            }
            removeClass(selectedClass.id);
            toast.success('Class deleted.', { description: `${selectedClass.name} has been removed.` });
            setShowDeleteConfirm(false);
            closeDrawer();
        } catch (err: any) {
            toast.error('Delete failed', { description: err.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;

        if (!newName.trim()) {
            setNameError('Name is required!');
            hasError = true;
        } else {
            setNameError('');
        }

        if (!newSubject.trim()) {
            setSubjectError('Subject is required!');
            hasError = true;
        } else {
            setSubjectError('');
        }

        const totalSelected = Object.entries(selectedStudentCounts).reduce((acc, [_, count]) => acc + count, 0);
        if (totalSelected === 0) {
            setStudentError('Please select at least one student!');
            hasError = true;
        } else {
            setStudentError('');
        }

        if (hasError) return;

        setIsGenerating(true);
        // Close drawer immediately and show skeleton
        closeDrawer();
        setPendingClass('manual');

        const classStudents: Student[] = [];
        Object.entries(selectedStudentCounts).forEach(([studentId, count]) => {
            const baseStudent = students.find(s => s.id === studentId);
            if (baseStudent) {
                if (count === 1) {
                    classStudents.push({ ...baseStudent });
                } else {
                    const fallbackNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'William', 'Ava', 'James', 'Isabella', 'Oliver', 'Sophia', 'Benjamin', 'Mia', 'Elijah', 'Charlotte', 'Lucas', 'Amelia', 'Mason', 'Harper', 'Logan', 'Evelyn', 'Alexander', 'Abigail', 'Michael', 'Emily', 'Ethan', 'Elizabeth', 'Daniel', 'Mila', 'Matthew', 'Ella', 'Henry', 'Avery', 'Jackson', 'Sofia', 'Sebastian', 'Camila', 'Aiden', 'Aria', 'David', 'Scarlett', 'Joseph', 'Victoria', 'Carter', 'Madison', 'Owen', 'Luna', 'Wyatt', 'Grace'];
                    const usedNames = new Set<string>();
                    usedNames.add(baseStudent.name);

                    for (let i = 1; i <= count; i++) {
                        let newName = baseStudent.name;
                        if (i > 1) {
                            let retries = 0;
                            do {
                                newName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
                                retries++;
                            } while (usedNames.has(newName) && retries < 10);

                            if (usedNames.has(newName)) {
                                newName = `${newName} ${i}`;
                            }
                            usedNames.add(newName);
                        }

                        classStudents.push({
                            ...baseStudent,
                            id: `${baseStudent.id}-${i}`,
                            name: newName
                        });
                    }
                }
            }
        });

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
            toast.success('Class saved successfully!', {
                description: `${newName} added to your active cohorts.`,
            });
        } catch (error: any) {
            console.error("Failed to save class:", error);
            toast.error('An error occurred while saving.', {
                description: error.message,
            });
        } finally {
            setPendingClass(null);
            setIsGenerating(false);
        }
    };

    const generateAIClass = async () => {
        if (students.length === 0) {
            toast.error('No student personas available!', { description: 'Create some student personas first before generating a class.' });
            return;
        }

        setIsAIGenerating(true);
        setPendingClass('ai');

        const classCombos = [
            { name: 'Room 101', subject: 'Mathematics', emoji: '📐' },
            { name: 'Science Lab A', subject: 'Biology', emoji: '🧬' },
            { name: 'English Seminar', subject: 'English Literature', emoji: '📚' },
            { name: 'Tech Workshop', subject: 'Computer Science', emoji: '💻' },
            { name: 'Art Studio', subject: 'Fine Arts', emoji: '🎨' },
            { name: 'Chemistry Lab', subject: 'Chemistry', emoji: '🧪' },
            { name: 'History Circle', subject: 'World History', emoji: '🌍' },
            { name: 'Music Room', subject: 'Music Theory', emoji: '🎼' },
            { name: 'Drama Hall', subject: 'Drama & Performance', emoji: '🎭' },
            { name: 'Gym Class A', subject: 'Physical Education', emoji: '⚽' },
            { name: 'Philosophy Seminar', subject: 'Philosophy', emoji: '🧠' },
            { name: 'Geography Room', subject: 'Geography', emoji: '🌍' },
            { name: 'Psychology 101', subject: 'Psychology', emoji: '🧠' },
            { name: 'Advanced Math', subject: 'Calculus', emoji: '📐' },
            { name: 'Reading Club', subject: 'Reading & Comprehension', emoji: '📚' },
        ];

        const combo = classCombos[Math.floor(Math.random() * classCombos.length)];

        // Pick 3-7 random students
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const count = 3 + Math.floor(Math.random() * 5); // 3 to 7
        const picked = shuffled.slice(0, Math.min(count, shuffled.length));

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: combo.name,
                    subject: combo.subject,
                    emoji: combo.emoji,
                    description: 'AI-generated class.',
                    students: picked,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate class');
            }

            const { virtualClass: newClass } = await response.json();
            addClass(newClass);
            toast.success('AI Class Generated!', { description: `${combo.name} – ${combo.subject} with ${picked.length} students.` });
        } catch (err: any) {
            console.error(err);
            toast.error('Generation failed', { description: err.message });
        } finally {
            setPendingClass(null);
            setIsAIGenerating(false);
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateDrawer}
                        className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95"
                    >
                        <Plus size={18} />
                        New Class
                    </button>
                    <button
                        onClick={generateAIClass}
                        disabled={isAIGenerating}
                        className="flex items-center gap-2 rounded-xl bg-indigo-500 dark:bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                        {isAIGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {isAIGenerating ? 'Generating...' : 'Generate Class'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-sky-400" />
                </div>
            ) : classes.length === 0 && !pendingClass ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p>No classes created yet.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Skeleton loading card — shown while class is being created/generated */}
                    {pendingClass && (
                        <div className="relative flex flex-col items-start overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 min-h-[180px]">
                            {/* Emoji placeholder */}
                            <div className="mb-4 h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            {/* Name bar */}
                            <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
                            {/* Subject row */}
                            <div className="h-4 w-28 rounded-lg bg-slate-100 dark:bg-slate-700/60 animate-pulse mb-6" />
                            {/* Footer row */}
                            <div className="mt-auto flex w-full items-center gap-2 border-t border-slate-50 dark:border-slate-700/50 pt-4">
                                <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-700/60 animate-pulse" />
                            </div>
                            {/* Central spinner */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 shadow-lg backdrop-blur-sm ring-1 ring-slate-200 dark:ring-slate-700">
                                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                                </div>
                            </div>
                            {/* Label */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-pulse">
                                    {pendingClass === 'ai' ? 'AI generating…' : 'Saving class…'}
                                </span>
                            </div>
                        </div>
                    )}
                    {classes.map((vClass) => (
                        <button
                            key={vClass.id}
                            onClick={() => openViewDrawer(vClass)}
                            className="group relative flex flex-col items-start overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 p-6 text-left shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-primary/20 dark:hover:ring-sky-500/30"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 shadow-sm transition-transform group-hover:scale-105 text-3xl">
                                {vClass.emoji || '🏫'}
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
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 text-4xl">
                                    {selectedClass.emoji || '🏫'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedClass.name}</h3>
                                    <p className="font-medium text-primary dark:text-sky-400">{selectedClass.subject}</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400">{selectedClass.description}</p>

                            {/* Live Aggregate Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-4 transition-colors">
                                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Activity size={14} /> Avg. Engagement</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                                        {isLoadingStats ? <Loader2 size={24} className="animate-spin text-slate-300" /> : `${overviewStats?.overallAverageSatisfaction || 0}%`}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium tracking-wide">
                                        {isLoadingStats ? '...' : `${overviewStats?.sessionCount || 0} RECORDED SESSION(S)`}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-4 transition-colors">
                                    <div className="mb-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock size={14} /> Total Time Taught</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                                        {isLoadingStats ? <Loader2 size={24} className="animate-spin text-slate-300" /> : overviewStats?.totalDurationSeconds ?
                                            (overviewStats.totalDurationSeconds >= 3600
                                                ? `${(overviewStats.totalDurationSeconds / 3600).toFixed(1)}h`
                                                : `${Math.floor(overviewStats.totalDurationSeconds / 60)}m ${overviewStats.totalDurationSeconds % 60}s`)
                                            : '0m 0s'}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium tracking-wide">
                                        {isLoadingStats ? '...' : 'ACROSS ALL SESSIONS'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Roster ({selectedClass.students?.length || 0})</h4>
                                <div className="space-y-2">
                                    {(selectedClass.students || []).map((student, idx) => (
                                        <div key={`${student.id}-${idx}`} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 overflow-hidden text-xl">
                                                <StudentAvatar name={student.name} age={student.age} avatarUrl={student.avatar_url} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</div>
                                                {student.condition && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {student.condition.split(',').map(c => c.trim()).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delete button */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 py-2.5 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 size={15} />
                                    Delete Class
                                </button>
                            </div>
                        </div>
                    )}

                    {drawerMode === 'create' && (
                        <form id="create-class-form" onSubmit={handleCreateClass} noValidate className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Class Name *</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => { setNewName(e.target.value); if (nameError) setNameError(''); }}
                                        placeholder="e.g. 10th Grade Honors"
                                        className={`w-full rounded-xl border bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all focus:ring-2 ${nameError
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-sky-500 focus:ring-primary/20 dark:focus:ring-sky-500/20'
                                            }`}
                                    />
                                    {nameError && (
                                        <p className="mt-1 text-xs text-red-500 font-medium">
                                            {nameError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Subject / Era *</label>
                                    <input
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => { setNewSubject(e.target.value); if (subjectError) setSubjectError(''); }}
                                        placeholder="e.g. Chemistry: Thermodynamics"
                                        className={`w-full rounded-xl border bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all focus:ring-2 ${subjectError
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-sky-500 focus:ring-primary/20 dark:focus:ring-sky-500/20'
                                            }`}
                                    />
                                    {subjectError && (
                                        <p className="mt-1 text-xs text-red-500 font-medium">
                                            {subjectError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Emoji *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newEmoji}
                                            onChange={(e) => setNewEmoji(e.target.value)}
                                            placeholder="🏫"
                                            className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none text-center text-xl"
                                        />
                                        <div className="flex flex-1 flex-wrap gap-2 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
                                            {['🏫', '📚', '🧪', '🎨', '🧬', '🧠', '💻', '🎭', '🎼', '⚽', '🌍', '📐'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setNewEmoji(emoji)}
                                                    className={`h-10 w-10 rounded-lg text-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${newEmoji === emoji ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <label className={`block text-sm font-semibold ${studentError ? 'text-red-500' : 'text-slate-900 dark:text-slate-200'}`}>Select Students *</label>
                                        {studentError && <span className="text-xs text-red-500">{studentError}</span>}
                                    </div>
                                    <span className="text-xs font-medium text-primary dark:text-sky-400">
                                        {Object.entries(selectedStudentCounts).reduce((acc, [_, count]) => acc + count, 0)} total
                                    </span>
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
                                        const count = selectedStudentCounts[student.id];
                                        const isSelected = count !== undefined;
                                        return (
                                            <div
                                                key={student.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleStudentSelection(student.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleStudentSelection(student.id); }}
                                                className={`flex w-full items-center justify-between rounded-lg p-3 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 ${isSelected ? 'bg-blue-50/50 dark:bg-sky-900/30 ring-1 ring-primary/30 dark:ring-sky-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 text-lg">
                                                        <StudentAvatar name={student.name} age={student.age} avatarUrl={student.avatar_url} />
                                                    </div>
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</span>
                                                    {student.condition && (
                                                        <span className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                                                            {student.condition}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2 mr-2 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-primary/20 p-0.5" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => updateStudentCount(e, student.id, -1)}
                                                                disabled={count <= 1}
                                                                className={`p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors ${count <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <Minus size={12} />
                                                            </button>
                                                            <span className="text-xs font-bold w-4 text-center dark:text-slate-200">{count}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => updateStudentCount(e, student.id, 1)}
                                                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-primary dark:border-sky-500 bg-primary dark:bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                        {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </div>
                                                </div>
                                            </div>
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowDeleteConfirm(false)}
                    />
                    <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700">
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Class</h3>
                        </div>
                        <p className="mt-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClass?.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClass}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
