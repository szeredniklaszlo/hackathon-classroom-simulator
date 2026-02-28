'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Student, StudentType } from '@/types/shared';
import { UserPlus, X, Sparkles, AlertCircle, Loader2, ArrowDownAZ, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentsPage() {
    const { students, addStudent, updateStudent, setStudents } = useStore();
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Fetch students on mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('/api/students');
                if (!response.ok) {
                    throw new Error('Failed to fetch students');
                }
                const data = await response.json();

                // Map DB data to local Student interface
                const mappedStudents: Student[] = data.students.map((dbStudent: any) => ({
                    id: dbStudent.id,
                    name: dbStudent.name,
                    age: dbStudent.age,
                    type: dbStudent.type,
                    emoji: dbStudent.emoji,
                    condition: dbStudent.condition,
                    personality: dbStudent.personality,
                    created_at: dbStudent.created_at,
                    moodScore: 50 + Math.floor(Math.random() * 30), // generic random starting mood
                    raisedHand: false,
                    learningStatus: 'Awaiting first lesson...',
                }));

                setStudents(mappedStudents);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error('Error loading students.');
            } finally {
                setIsLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [setStudents]);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('🧐');
    const [newAge, setNewAge] = useState<number | ''>('');
    const [newConditions, setNewConditions] = useState<string[]>([]);
    const [customCondition, setCustomCondition] = useState('');
    const [newPersonality, setNewPersonality] = useState('');
    const [activityLevel, setActivityLevel] = useState(50);
    const [conflictLevel, setConflictLevel] = useState(20);
    const [attentionSpan, setAttentionSpan] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);

    // Validation State
    const [nameError, setNameError] = useState('');
    const [ageError, setAgeError] = useState('');

    const openCreateDrawer = () => {
        setEditingStudent(null);
        setNewName('');
        setNewEmoji('🧠');
        setNewAge('');
        setNewConditions([]);
        setCustomCondition('');
        setNewPersonality('');
        setActivityLevel(50);
        setConflictLevel(20);
        setAttentionSpan(50);
        setAgeError('');
        setNameError('');
        setIsDrawerOpen(true);
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setNewName(student.name);
        setNewEmoji(student.emoji || '🧠');
        setNewAge(student.age);

        // Handle condition parsing (assuming comma separated string in DB)
        const condString = student.condition || '';
        const presets = ['ADHD', 'Autism', 'Dyslexia', 'Anxiety'];
        const parts = condString.split(',').map(s => s.trim()).filter(Boolean);

        const selectedPresets = parts.filter(p => presets.includes(p));
        const customParts = parts.filter(p => !presets.includes(p));

        setNewConditions(selectedPresets);
        setCustomCondition(customParts.join(', '));
        setNewPersonality(student.personality || '');

        // We don't have sliders stored in the local Student type currently, 
        // so we'll use defaults or you might want to fetch full details.
        // For now, let's stick to defaults or mock values.
        setActivityLevel(50);
        setConflictLevel(20);
        setAttentionSpan(50);

        setAgeError('');
        setNameError('');
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
    }, [students.length]); // Wait for initial data load to be safe

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

    const handleGenerateStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        let isValid = true;

        // Validation
        if (!newName.trim()) {
            setNameError('Name is required!');
            isValid = false;
        } else {
            setNameError('');
        }

        if (newAge === '' || newAge < 6 || newAge > 18) {
            setAgeError('Age must be between 6 and 18!');
            isValid = false;
        } else {
            setAgeError('');
        }

        if (!isValid) return;

        setIsGenerating(true);
        const type = determineStudentType();
        const condition = [...newConditions, ...(customCondition.trim() ? [customCondition.trim()] : [])].join(', ') || null;

        try {
            // Call the Backend API
            const response = await fetch('/api/students', {
                method: editingStudent ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingStudent?.id, // Only for PATCH
                    name: newName,
                    age: newAge,
                    emoji: newEmoji,
                    personality: newPersonality,
                    activity_level: activityLevel,
                    conflict_level: conflictLevel,
                    attention_span: attentionSpan,
                    type: type,
                    condition: condition
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save student');
            }

            const { student: dbStudent } = await response.json();

            // Construct client state student
            const studentData: Student = {
                id: dbStudent.id,
                name: newName,
                age: newAge as number,
                type: dbStudent.type || type,
                condition: condition,
                personality: newPersonality,
                created_at: dbStudent.created_at || new Date().toISOString(),
                emoji: newEmoji,
                moodScore: editingStudent ? editingStudent.moodScore : 50 + Math.floor(Math.random() * 30),
                raisedHand: editingStudent ? editingStudent.raisedHand : false,
                learningStatus: editingStudent ? editingStudent.learningStatus : 'Awaiting first lesson...',
            };

            if (editingStudent) {
                updateStudent(studentData);
                toast.success('Student updated successfully!');
            } else {
                addStudent(studentData);
                toast.success('Student successfully generated and saved!', {
                    description: `${newName} added to the persona pool.`,
                });
            }
            closeDrawer();
        } catch (error: any) {
            console.error("Failed to save student:", error);
            toast.error('An error occurred while saving.', {
                description: error.message,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const generateAIPersonaDirect = async () => {
        setIsAIGenerating(true);
        toast.info("Generating AI Persona...", { id: "ai-gen" });
        try {
            const response = await fetch('/api/students/generate', { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate persona');
            }

            const data = await response.json();

            if (data.student) {
                const generated = data.student;
                const newStudent: Student = {
                    id: generated.id,
                    name: generated.name,
                    age: generated.age,
                    type: generated.type,
                    condition: generated.condition,
                    personality: generated.personality,
                    created_at: generated.created_at || new Date().toISOString(),
                    emoji: generated.emoji,
                    moodScore: 50 + Math.floor(Math.random() * 30),
                    raisedHand: false,
                    learningStatus: 'Awaiting first lesson...',
                };

                addStudent(newStudent);
                toast.success('AI Persona Generated!', { id: "ai-gen", description: `${newStudent.name} has been added.` });
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Generation failed', { id: "ai-gen", description: err.message });
        } finally {
            setIsAIGenerating(false);
        }
    };

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            if (sortOption === 'name') {
                return a.name.localeCompare(b.name);
            }
            // default to lowest/highest dates
            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (sortOption === 'oldest') {
                return aDate - bDate;
            }
            // newest
            return bDate - aDate;
        });
    }, [students, sortOption]);

    return (
        <div className="relative mx-auto max-w-5xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Student Personas</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Manage and create AI-driven student profiles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateDrawer}
                        className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95"
                    >
                        <UserPlus size={18} />
                        New Persona
                    </button>
                    <button
                        onClick={generateAIPersonaDirect}
                        disabled={isAIGenerating}
                        className="flex items-center gap-2 rounded-xl bg-indigo-500 dark:bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                        {isAIGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {isAIGenerating ? 'Generating...' : 'Generate Persona'}
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            {!isLoadingStudents && students.length > 0 && (
                <div className="mb-6 flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-800/80 p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Showing <span className="font-bold text-slate-900 dark:text-white">{students.length}</span> Personas
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort by:</label>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as any)}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm outline-none transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="newest" className="text-slate-900 bg-white">Newest First</option>
                            <option value="oldest" className="text-slate-900 bg-white">Oldest First</option>
                            <option value="name" className="text-slate-900 bg-white">Name (A-Z)</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Grid */}
            {isLoadingStudents ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400" />
                </div>
            ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <UserPlus className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p>No students generated yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedStudents.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => handleEditClick(student)}
                            className="group flex flex-col items-start text-left w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-indigo-500/20 dark:hover:ring-indigo-500/30"
                        >
                            <div className="flex w-full items-start justify-between relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-2xl shadow-sm">
                                    {student.emoji}
                                </div>
                                {student.condition && (
                                    <div className="absolute top-0 right-0 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full z-10 shadow-sm truncate max-w-[120px]">
                                        {student.condition}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex w-full items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{student.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{student.age} years old</p>
                                </div>
                                {student.created_at && (
                                    <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
                                        Added<br />
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 w-full rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
                                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                                    <AlertCircle size={14} className="text-amber-500" />
                                    Personality
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{student.personality || "-"}</p>
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
                    <div className="flex items-center gap-2">
                        {editingStudent ? <UserPlus className="text-indigo-500" size={20} /> : <UserPlus className="text-secondary dark:text-sky-400" size={20} />}
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {editingStudent ? 'Edit Persona' : 'Create New Persona'}
                        </h2>
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="rounded-full p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="generate-student-form" onSubmit={handleGenerateStudent} noValidate className="space-y-6">

                        {/* Basic Info */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Student Name *</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => { setNewName(e.target.value); if (nameError) setNameError(''); }}
                                    placeholder="e.g. Liam"
                                    className={`w-full rounded-xl border bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${nameError
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20'
                                        }`}
                                />
                                {nameError && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {nameError}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Emoji *</label>
                                <input
                                    type="text"
                                    value={newEmoji}
                                    onChange={(e) => setNewEmoji(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 text-center text-xl outline-none transition-all focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Age Field */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Age *</label>
                            <input
                                type="number"
                                value={newAge}
                                onChange={(e) => {
                                    setNewAge(e.target.value === '' ? '' : Number(e.target.value));
                                    if (ageError) setAgeError('');
                                }}
                                onBlur={() => {
                                    if (newAge !== '' && (newAge < 6 || newAge > 18)) {
                                        setAgeError('Age must be between 6 and 18!');
                                    }
                                }}
                                placeholder="Age (6-18)"
                                className={`w-full rounded-xl border bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all focus:ring-2 ${ageError
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20'
                                    }`}
                            />
                            {ageError && (
                                <p className="mt-1 text-xs text-red-500 font-medium">
                                    {ageError}
                                </p>
                            )}
                        </div>

                        {/* Condition / Disability Field */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-200">Conditions / Special Needs</label>

                            {/* Preset Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {['None', 'ADHD', 'Autism', 'Dyslexia', 'Anxiety'].map((cond) => {
                                    const isSelected = cond === 'None' ? newConditions.length === 0 && !customCondition : newConditions.includes(cond);
                                    return (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => {
                                                if (cond === 'None') {
                                                    setNewConditions([]);
                                                    setCustomCondition('');
                                                } else {
                                                    setNewConditions(prev =>
                                                        prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
                                                    );
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {cond}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Condition Input */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={customCondition}
                                    onChange={(e) => setCustomCondition(e.target.value)}
                                    placeholder="Add custom condition (e.g. PTSD)..."
                                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Personality Sliders */}
                        <div className="space-y-6 rounded-2xl border border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 p-5">
                            <div>
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">Personality Configuration</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Adjust the sliders to shape the AI agent's behavior during class simulations.</p>
                            </div>

                            {/* Activity Level */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-500 dark:text-slate-400">Passive</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">Activity Level</span>
                                    <span className="text-slate-500 dark:text-slate-400">Hyperactive</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 dark:bg-slate-700 rounded-full outline-none accent-indigo-600 dark:accent-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            {/* Conflict Level */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-emerald-500">Peaceful</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">Conflict Level</span>
                                    <span className="text-rose-500">Chaotic</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={conflictLevel}
                                    onChange={(e) => setConflictLevel(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 dark:bg-slate-700 rounded-full outline-none accent-indigo-600 dark:accent-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            {/* Attention Span */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-amber-500">Easily Distracted</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">Attention Span</span>
                                    <span className="text-blue-500">Laser Focus</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={attentionSpan}
                                    onChange={(e) => setAttentionSpan(parseInt(e.target.value))}
                                    className="w-full appearance-none h-2 bg-slate-200 dark:bg-slate-700 rounded-full outline-none accent-indigo-600 dark:accent-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Personality (Free Text) */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-200">Student Personality</label>
                            <textarea
                                value={newPersonality}
                                onChange={(e) => setNewPersonality(e.target.value)}
                                placeholder="Describe the student's background, quirks, and behavior..."
                                className="w-full h-24 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50 dark:text-slate-100 px-4 py-2.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
                            />
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900 mt-auto">
                    <button
                        type="submit"
                        form="generate-student-form"
                        disabled={isGenerating}
                        className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-500 dark:bg-indigo-600 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isGenerating ? 'Saving...' : 'Save Persona'}
                    </button>
                </div>
            </div>
        </div>
    );
}

