'use client';

import { useStore } from '@/store/useStore';
import { BrainCircuit, PlayCircle, PlusCircle, UserPlus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
    { name: 'Mon', engagement: 65, conflict: 12 },
    { name: 'Tue', engagement: 72, conflict: 15 },
    { name: 'Wed', engagement: 68, conflict: 5 },
    { name: 'Thu', engagement: 85, conflict: 8 },
    { name: 'Fri', engagement: 92, conflict: 3 },
];

export default function Dashboard() {
    const classes = useStore((state) => state.classes);
    // Display only up to 3 recent classes
    const recentClasses = classes.slice(0, 3);

    return (
        <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good morning, Dr. Taylor 👋</h1>
                <p className="mt-1 text-slate-500">Ready to challenge your teaching skills today?</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/classes" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary transition-transform group-hover:scale-110">
                            <PlusCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Create New Class</h3>
                            <p className="text-sm text-slate-500">Organize a new cohort</p>
                        </div>
                    </div>
                </Link>

                <Link href="/students" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-transform group-hover:scale-110">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Generate Student</h3>
                            <p className="text-sm text-slate-500">Design an AI persona</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Chart Section */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Overall Progress</h2>
                            <p className="text-sm text-slate-500">Average student engagement over time</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
                            <TrendingUp size={16} />
                            +12%
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                        color: '#0f172a'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="engagement"
                                    name="Engagement %"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Classes List */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Recent Sessions</h2>
                        <Link href="/classes" className="text-sm font-medium text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentClasses.map((vClass) => (
                            <div key={vClass.id} className="group relative flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                                    {vClass.emoji}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="truncate font-semibold text-slate-900" title={vClass.name}>{vClass.name}</h4>
                                    <p className="truncate text-xs text-slate-500" title={vClass.subject}>{vClass.subject}</p>
                                </div>
                                <Link href={`/class/${vClass.id}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all group-hover:opacity-100 hover:bg-primary hover:text-white">
                                    <PlayCircle size={18} />
                                    <span className="sr-only">Start</span>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-xl bg-blue-50 p-4 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <BrainCircuit className="mt-0.5 text-primary shrink-0" size={18} />
                            <p className="text-xs text-blue-800 font-medium">
                                AI Coach Tip: Your ability to handle disruptions improved by 12% this week! Consider trying the "Class Clown" persona to test your skills further.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
