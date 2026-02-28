'use client';

import { useStore } from '@/store/useStore';
import {
    BrainCircuit, PlayCircle, PlusCircle, UserPlus,
    TrendingUp, Users, BookOpen, Activity, Clock,
    ChevronRight, Zap, Target, BarChart3, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';

const mockEngagementData = [
    { day: 'Mon', avg: 62, peak: 78 },
    { day: 'Tue', avg: 71, peak: 89 },
    { day: 'Wed', avg: 65, peak: 74 },
    { day: 'Thu', avg: 83, peak: 95 },
    { day: 'Fri', avg: 90, peak: 97 },
    { day: 'Sat', avg: 76, peak: 88 },
    { day: 'Sun', avg: 85, peak: 93 },
];

const studentTypeColors: Record<string, string> = {
    'Fast Learner': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    'ESL Student': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Easily Distracted': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'Deep Thinker': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    'Anxious Achiever': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    'Class Clown': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

export default function Dashboard() {
    const classes = useStore((state) => state.classes);
    const students = useStore((state) => state.students);
    const [userName, setUserName] = useState('Teacher');
    const [initials, setInitials] = useState('T');
    const [greeting, setGreeting] = useState('Welcome');
    const [currentTime, setCurrentTime] = useState('');

    const totalClasses = classes.length;
    const totalStudents = students.length;
    const recentClasses = [...classes].slice(0, 4);

    // Student type breakdown for the mini chart
    const typeCount: Record<string, number> = {};
    students.forEach(s => {
        typeCount[s.type] = (typeCount[s.type] || 0) + 1;
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        const tick = () => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Teacher';
                setUserName(name);
                const parts = name.split(' ').filter(Boolean);
                let init = parts[0]?.[0] || 'T';
                if (parts.length > 1) init += parts[parts.length - 1][0];
                setInitials(init.toUpperCase());
            }
        };
        fetchUser();
    }, []);

    const statCards = [
        {
            label: 'Total Classes',
            value: totalClasses,
            icon: BookOpen,
            color: 'text-sky-500 dark:text-sky-400',
            bg: 'bg-sky-50 dark:bg-sky-900/20',
            href: '/classes',
        },
        {
            label: 'AI Personas',
            value: totalStudents,
            icon: Users,
            color: 'text-indigo-500 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            href: '/students',
        },
        {
            label: 'Avg Engagement',
            value: '78%',
            icon: TrendingUp,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            href: '/classes',
        },
        {
            label: 'Sessions Run',
            value: totalClasses * 2,
            icon: Activity,
            color: 'text-violet-500 dark:text-violet-400',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            href: '/classes',
        },
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8">

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-widest bg-sky-50 dark:bg-sky-900/30 px-2.5 py-0.5 rounded-full">
                            🔴 Live
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{currentTime}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                        {greeting}, {userName} 👋
                    </h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
                        Welcome to your MindSim AI classroom command center.
                    </p>
                </div>

                {/* Quick Launch CTAs */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                        href="/students?action=new"
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
                    >
                        <UserPlus size={16} />
                        New Persona
                    </Link>
                    <Link
                        href="/classes?action=new"
                        className="flex items-center gap-2 bg-primary text-white hover:bg-sky-500 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-sky-400/30"
                    >
                        <PlusCircle size={16} />
                        New Class
                    </Link>
                </div>
            </div>

            {/* ── KPI Stat Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="group bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 hover:shadow-md hover:ring-sky-200 dark:hover:ring-sky-800/50 transition-all"
                        >
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                                <Icon size={20} className={card.color} />
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                                {card.value}
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                {card.label}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* ── Main Content Grid ────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Engagement Chart — 2/3 width */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-slate-100">Weekly Engagement</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average class satisfaction score</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                            <TrendingUp size={12} /> +14%
                        </span>
                    </div>

                    <div className="h-56 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockEngagementData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPeak" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)', backgroundColor: '#fff', color: '#0f172a' }}
                                    labelStyle={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 2' }}
                                />
                                <Area type="monotone" dataKey="peak" name="Peak %" stroke="#818cf8" strokeWidth={2} fill="url(#gradPeak)" dot={false} />
                                <Area type="monotone" dataKey="avg" name="Avg %" stroke="#0ea5e9" strokeWidth={3} fill="url(#gradAvg)" dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-2 justify-end">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="w-3 h-0.5 rounded-full bg-sky-400 inline-block" /> Average
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="w-3 h-0.5 rounded-full bg-indigo-400 inline-block" /> Peak
                        </span>
                    </div>
                </div>

                {/* Quick Actions Panel — 1/3 width */}
                <div className="flex flex-col gap-4">
                    {/* AI Coach Tip */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-6 -left-2 w-16 h-16 bg-white/10 rounded-full" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-yellow-300" />
                                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">AI Coach Insight</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed">
                                Your ability to handle disruptions improved by <strong>12%</strong> this week! Try a Class Clown persona to push further.
                            </p>
                        </div>
                    </div>

                    {/* Quick-launch cards */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Zap size={15} className="text-amber-400" /> Quick Actions
                        </h3>
                        {[
                            { label: 'Launch Simulation', icon: PlayCircle, href: classes[0] ? `/class/${classes[0].id}` : '/classes', color: 'text-sky-500' },
                            { label: 'Browse Classes', icon: BookOpen, href: '/classes', color: 'text-indigo-500' },
                            { label: 'Generate Persona', icon: UserPlus, href: '/students?action=new', color: 'text-violet-500' },
                            { label: 'View Analytics', icon: BarChart3, href: '/classes', color: 'text-emerald-500' },
                        ].map(action => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.label} href={action.href} className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <Icon size={16} className={action.color} />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
                                    </span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Bottom Row: Recent Classes + Persona Roster ──────────── */}
            <div className="grid gap-6 lg:grid-cols-5">

                {/* Recent Classes — 3/5 */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Target size={16} className="text-primary" /> Recent Classes
                        </h2>
                        <Link href="/classes" className="text-xs font-semibold text-primary dark:text-sky-400 hover:underline">
                            View all
                        </Link>
                    </div>

                    {recentClasses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-3">
                                <BookOpen size={22} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No classes yet</p>
                            <Link href="/classes?action=new" className="mt-3 text-xs font-bold text-primary dark:text-sky-400 hover:underline">
                                Create your first class →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentClasses.map((vClass) => (
                                <div
                                    key={vClass.id}
                                    className="group flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-700/50 p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:border-sky-100 dark:hover:border-sky-900/40"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/50 text-sky-500 dark:text-sky-400">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="truncate font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                {vClass.name}
                                            </h4>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2 hidden sm:block">
                                                {vClass.students?.length || 0} students
                                            </span>
                                        </div>
                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">{vClass.subject}</p>
                                    </div>
                                    <Link
                                        href={`/class/${vClass.id}`}
                                        className="shrink-0 flex items-center gap-1.5 bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-400 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white dark:hover:bg-sky-500 dark:hover:text-white"
                                    >
                                        <PlayCircle size={13} /> Launch
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Persona Roster — 2/5 */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users size={16} className="text-indigo-500" /> Persona Roster
                        </h2>
                        <Link href="/students" className="text-xs font-semibold text-primary dark:text-sky-400 hover:underline">
                            View all
                        </Link>
                    </div>

                    {students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-3">
                                <Users size={22} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No personas yet</p>
                            <Link href="/students?action=new" className="mt-3 text-xs font-bold text-primary dark:text-sky-400 hover:underline">
                                Generate first persona →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {students.slice(0, 5).map((student) => (
                                <div key={student.id} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                                        <img
                                            src={`https://wsrv.nl/?url=${encodeURIComponent(`avatar.iran.liara.run/public?username=${student.name}_${student.age}`)}`}
                                            alt={student.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{student.name}</p>
                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${studentTypeColors[student.type] || 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            {student.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                                                style={{ width: `${student.moodScore || 70}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums w-7 text-right">{student.moodScore || 70}%</span>
                                    </div>
                                </div>
                            ))}
                            {students.length > 5 && (
                                <Link href="/students" className="block text-center text-xs font-semibold text-primary dark:text-sky-400 hover:underline pt-1">
                                    +{students.length - 5} more personas
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
