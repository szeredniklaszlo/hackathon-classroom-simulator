'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    BrainCircuit, ChevronRight, User, Sparkles, PlayCircle,
    Zap, Shield, BarChart3, ArrowRight, CheckCircle2, GraduationCap,
    Circle, Cpu, Activity
} from 'lucide-react';

// ─────────────────────────────────────────────────
// Typewriter hook
// ─────────────────────────────────────────────────
function useTypewriter(messages: string[], speed = 45, pause = 2200) {
    const [displayed, setDisplayed] = useState('');
    const [msgIdx, setMsgIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const current = messages[msgIdx];
        const timeout = setTimeout(() => {
            if (!deleting) {
                if (charIdx < current.length) {
                    setDisplayed(current.slice(0, charIdx + 1));
                    setCharIdx(c => c + 1);
                } else {
                    setTimeout(() => setDeleting(true), pause);
                }
            } else {
                if (charIdx > 0) {
                    setDisplayed(current.slice(0, charIdx - 1));
                    setCharIdx(c => c - 1);
                } else {
                    setDeleting(false);
                    setMsgIdx(i => (i + 1) % messages.length);
                }
            }
        }, deleting ? speed / 2 : speed);
        return () => clearTimeout(timeout);
    }, [charIdx, deleting, msgIdx, messages, speed, pause]);

    return displayed;
}

// ─────────────────────────────────────────────────
// Reveal-on-scroll hook
// ─────────────────────────────────────────────────
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

// ─────────────────────────────────────────────────
// Feature Card 1 — Diagnostic Shuffler
// ─────────────────────────────────────────────────
const personaLabels = ['Anxious Achiever', 'Class Clown', 'Deep Thinker', 'Fast Learner', 'ESL Student'];
function ShufflerCard() {
    const [stack, setStack] = useState(personaLabels);
    useEffect(() => {
        const t = setInterval(() => {
            setStack(prev => {
                const next = [...prev];
                const last = next.pop()!;
                next.unshift(last);
                return next;
            });
        }, 2400);
        return () => clearInterval(t);
    }, []);

    const colors = [
        'bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800/50 text-sky-700 dark:text-sky-300',
        'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300',
        'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800/50 text-violet-700 dark:text-violet-300',
        'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-500',
    ];

    return (
        <div className="relative h-40 flex flex-col items-center justify-center">
            {stack.slice(0, 4).map((label, i) => (
                <div
                    key={label}
                    className={`absolute w-full border rounded-2xl px-5 py-3.5 font-semibold text-sm transition-all duration-700 ${colors[i]}`}
                    style={{
                        transform: `translateY(${i * 10}px) scale(${1 - i * 0.04})`,
                        zIndex: 10 - i,
                        opacity: 1 - i * 0.2,
                    }}
                >
                    {label}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────
// Feature Card 2 — Telemetry Typewriter
// ─────────────────────────────────────────────────
const typeMessages = [
    '> Student "Logan" engagement: 78%',
    '> Conflict detected: "Michael J." disrupting…',
    '> Teacher prompt processed: "Can you explain?"',
    '> New response generated in 1.2s',
    '> Satisfaction score updated: 84 → 91',
    '> Class sentiment: ENGAGED ↑',
];
function TypewriterCard() {
    const text = useTypewriter(typeMessages, 40, 1800);
    return (
        <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-emerald-400 h-32 overflow-hidden relative">
            <div className="absolute top-3 left-4 flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="mt-6 leading-relaxed">
                <span>{text}</span>
                <span className="inline-block w-[2px] h-[1em] bg-emerald-400 ml-0.5 animate-pulse align-middle" />
            </div>
            <div className="absolute top-3 right-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-500/70 text-[10px] uppercase tracking-wider">Live</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────
// Feature Card 3 — Weekly Schedule Visualizer
// ─────────────────────────────────────────────────
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function SchedulerCard() {
    const [activeDay, setActiveDay] = useState(1);
    useEffect(() => {
        const t = setInterval(() => setActiveDay(d => (d + 1) % 7), 1100);
        return () => clearInterval(t);
    }, []);

    const sessionLoad = [1, 3, 2, 4, 3, 2, 0];
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d, i) => (
                    <div key={i} className={`flex flex-col items-center gap-1.5 rounded-xl py-2 transition-all duration-500 ${activeDay === i ? 'bg-sky-500 shadow-lg shadow-sky-500/30 scale-105' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                        <span className={`text-[11px] font-bold ${activeDay === i ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{d}</span>
                        {Array.from({ length: sessionLoad[i] }).map((_, k) => (
                            <div key={k} className={`w-1 h-1 rounded-full ${activeDay === i ? 'bg-white/80' : 'bg-sky-400/60'}`} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][activeDay]} — {sessionLoad[activeDay]} session{sessionLoad[activeDay] !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-sky-500">Track Progress →</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────
export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresReveal = useReveal();
    const manifestoReveal = useReveal();
    const stepsReveal = useReveal();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: <Zap size={20} className="text-sky-400" />,
            title: 'AI-Powered Personas',
            desc: 'Each student is an independent LLM agent with a unique personality profile — anxious achievers, class clowns, deep thinkers.',
            card: <ShufflerCard />,
        },
        {
            icon: <Activity size={20} className="text-emerald-400" />,
            title: 'Real-Time Feedback',
            desc: 'Monitor live engagement signals, conflict moments, and satisfaction scores as your class unfolds.',
            card: <TypewriterCard />,
        },
        {
            icon: <BarChart3 size={20} className="text-violet-400" />,
            title: 'Insights & Analytics',
            desc: 'Track your progress over time with session replays, satisfaction timelines, and per-student breakdowns.',
            card: <SchedulerCard />,
        },
    ];

    const steps = [
        {
            num: '01',
            icon: <GraduationCap size={28} />,
            title: 'Build Your Class',
            desc: 'Generate AI student personas with unique personalities, backgrounds, and behavioral tendencies using our AI generator.',
        },
        {
            num: '02',
            icon: <PlayCircle size={28} />,
            title: 'Run the Simulation',
            desc: 'Speak naturally while our AI orchestrates student reactions in real-time — questions, interruptions, emotional shifts.',
        },
        {
            num: '03',
            icon: <BarChart3 size={28} />,
            title: 'Review & Improve',
            desc: 'Get session reports with transcript replays, satisfaction charts, and AI coaching tips to sharpen your skills.',
        },
    ];

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">

            {/* ── Noise Texture Overlay ──────────────────────────────── */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: 'repeat', backgroundSize: '200px' }}
            />

            {/* ── Floating Navbar ───────────────────────────────────── */}
            <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
                <nav className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-3 transition-all duration-500 ${scrolled
                    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/80 dark:ring-slate-700/50'
                    : 'bg-transparent'
                    }`}>
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow">
                            <BrainCircuit size={18} />
                        </div>
                        <span className={`font-bold tracking-tight text-sm ${scrolled ? 'text-slate-800 dark:text-slate-100' : 'text-white'}`}>
                            MindSim AI
                        </span>
                    </Link>

                    <div className={`hidden sm:flex items-center gap-6 text-sm font-medium ${scrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white/80'}`}>
                        <a href="#features" className="hover:text-sky-500 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-sky-500 transition-colors">How it works</a>
                        <a href="#manifesto" className="hover:text-sky-500 transition-colors">About</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${scrolled ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-white/80 hover:text-white'}`}
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-primary/30 hover:bg-sky-500 hover:scale-[1.03] transition-all"
                            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                        >
                            Get Started <ChevronRight size={14} />
                        </Link>
                    </div>
                </nav>
            </header>

            {/* ── Hero Section ──────────────────────────────────────── */}
            <section
                ref={heroRef}
                className="relative min-h-screen flex flex-col justify-end pb-24 px-6 overflow-hidden"
            >
                {/* Background image with gradient overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2000&q=80"
                        alt="AI classroom environment"
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />
                </div>

                {/* Animated floating orbs */}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

                {/* Hero content — bottom-left */}
                <div className="relative z-10 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs font-semibold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AI-Powered Teaching Simulator
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                        Teaching is the{' '}
                        <br />
                        <em
                            className="not-italic font-black"
                            style={{
                                fontFamily: "'Playfair Display', 'Georgia', serif",
                                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            ultimate skill.
                        </em>
                    </h1>

                    <p className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed mb-10">
                        Practice with intelligent, LLM-driven student avatars.
                        Real reactions. Real feedback. Safe environment.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <Link
                            href="/login"
                            className="group relative overflow-hidden flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.03] transition-all text-base"
                            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                        >
                            <span className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                            <User size={18} />
                            Start Simulating
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-white/70 hover:text-white font-semibold px-6 py-4 rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-base"
                        >
                            <Sparkles size={16} />
                            Continue as Guest
                        </Link>
                    </div>

                    {/* Social proof */}
                    <div className="mt-12 flex items-center gap-6 text-white/50 text-sm">
                        {[
                            { v: '5+', l: 'AI Personas' },
                            { v: '100%', l: 'Real-time' },
                            { v: '∞', l: 'Scenarios' },
                        ].map(item => (
                            <div key={item.l} className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">{item.v}</span>
                                <span>{item.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features Section ─────────────────────────────────── */}
            <section id="features" className="bg-background py-28 px-6">
                <div className="max-w-5xl mx-auto">
                    <div
                        ref={featuresReveal.ref}
                        className={`text-center mb-16 transition-all duration-700 ${featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Core Capabilities</p>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                            A classroom that<br />
                            <span className="text-sky-500 dark:text-sky-400">thinks back.</span>
                        </h2>
                        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
                            Every student is an autonomous agent responding dynamically to your teaching style.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className={`bg-white dark:bg-slate-800/80 rounded-3xl p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                style={{ transitionDelay: `${i * 120}ms` }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                                        {f.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{f.title}</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{f.desc}</p>
                                <div className="mt-auto">
                                    {f.card}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Manifesto / Philosophy ────────────────────────────── */}
            <section
                id="manifesto"
                className="relative py-32 px-6 overflow-hidden bg-slate-950"
            >
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=2000&q=60')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-indigo-950/60" />

                <div
                    ref={manifestoReveal.ref}
                    className={`relative z-10 max-w-4xl mx-auto transition-all duration-1000 ${manifestoReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-2xl">
                        Most teaching training focuses on:<br />
                        <span className="text-white/60">scripted scenarios, passive observation, and delayed feedback.</span>
                    </p>

                    <h2
                        className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        We focus on:{' '}
                        <em className="not-italic" style={{ color: '#38bdf8' }}>
                            live, adaptive,
                        </em>
                        <br />
                        <em className="not-italic" style={{ color: '#818cf8' }}>
                            AI-driven reality.
                        </em>
                    </h2>

                    <div className="mt-12 grid sm:grid-cols-3 gap-6">
                        {[
                            { label: 'Safe to fail', icon: Shield },
                            { label: 'Instant feedback', icon: Zap },
                            { label: 'Real AI reactions', icon: Cpu },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                                    <Icon size={18} className="text-sky-400 shrink-0" />
                                    <span className="text-white/80 font-semibold text-sm">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── How It Works ─────────────────────────────────────── */}
            <section id="how-it-works" className="bg-background py-28 px-6">
                <div className="max-w-5xl mx-auto">
                    <div
                        ref={stepsReveal.ref}
                        className={`text-center mb-16 transition-all duration-700 ${stepsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">The Protocol</p>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                            Three steps to mastery
                        </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {steps.map((step, i) => (
                            <div
                                key={step.num}
                                className={`relative bg-white dark:bg-slate-800/80 rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${stepsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                style={{ transitionDelay: `${i * 150}ms` }}
                            >
                                <div className="font-mono text-xs font-bold text-slate-300 dark:text-slate-600 mb-4 tracking-widest">
                                    {step.num}
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 dark:text-sky-400 mb-5">
                                    {step.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{step.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>

                                {i < 2 && (
                                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40">
                                        <ChevronRight size={14} className="text-sky-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ───────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-sky-500 to-sky-400 rounded-3xl p-12 shadow-2xl shadow-sky-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                        <div className="relative z-10">
                            <BrainCircuit size={36} className="text-white/80 mx-auto mb-4" />
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                                Ready to transform<br /> your teaching?
                            </h2>
                            <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                                Jump into a live simulation or explore the platform as a guest.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/login"
                                    className="group relative overflow-hidden flex items-center gap-2 bg-white text-sky-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:scale-[1.03] transition-all"
                                >
                                    <span className="absolute inset-0 bg-sky-50 translate-x-[-110%] group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                                    <User size={18} className="relative z-10" />
                                    <span className="relative z-10">Sign Up Free</span>
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2 text-white font-semibold hover:text-white/90 transition-colors px-4 py-4"
                                >
                                    <Sparkles size={16} />
                                    Try as Guest
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="bg-slate-950 rounded-t-[3rem] py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid sm:grid-cols-3 gap-10 mb-12">
                        <div>
                            <Link href="/" className="flex items-center gap-2.5 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                                    <BrainCircuit size={18} />
                                </div>
                                <span className="font-bold text-white tracking-tight">MindSim AI</span>
                            </Link>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-48">
                                AI-powered classroom simulator for modern educators.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
                            <div className="space-y-2">
                                {['Dashboard', 'Classes', 'Student Personas', 'Analytics'].map(link => (
                                    <Link key={link} href="/dashboard" className="block text-slate-500 hover:text-sky-400 text-sm transition-colors">
                                        {link}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold text-sm mb-4">Get Started</h4>
                            <div className="space-y-2">
                                {[{ l: 'Sign In', h: '/login' }, { l: 'Guest Access', h: '/dashboard' }].map(item => (
                                    <Link key={item.l} href={item.h} className="block text-slate-500 hover:text-sky-400 text-sm transition-colors">
                                        {item.l}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-slate-600 text-xs">
                            © 2026 MindSim AI. Built for educators.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono text-xs text-slate-500">SYSTEM OPERATIONAL</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
