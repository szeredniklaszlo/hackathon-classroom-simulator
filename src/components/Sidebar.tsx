'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserSquare, BrainCircuit, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import DemoButton from '@/components/DemoButton';

const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Classes', href: '/classes', icon: Users },
    { name: 'Student Personas', href: '/students', icon: UserSquare },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState('Teacher');
    const [initials, setInitials] = useState('T');
    const [isGuest, setIsGuest] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
                setIsGuest(false);
            } else {
                // Guest
                let guestName = sessionStorage.getItem('guestName');
                if (!guestName) {
                    const num = Math.floor(1000 + Math.random() * 9000);
                    guestName = `Guest${num}`;
                    sessionStorage.setItem('guestName', guestName);
                }
                setUserName(guestName);
                setInitials('G');
                setIsGuest(true);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (!isGuest) {
                const supabase = createClient();
                await supabase.auth.signOut();
            }
            // Clear guest session data
            sessionStorage.removeItem('guestName');
        } finally {
            router.push('/');
        }
    };

    return (
        <>
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform">
                <div className="flex h-full flex-col overflow-y-auto px-4 py-8">
                    {/* Logo Area */}
                    <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                            <BrainCircuit size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            MindSim AI
                        </span>
                    </Link>

                    {/* 🚀 Demo Mode CTA */}
                    <div className="mb-6">
                        <DemoButton variant="sidebar" />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1.5">
                            4 AI students · No setup needed
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 space-y-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${isActive
                                        ? 'bg-primary/10 text-primary dark:bg-sky-900/40 dark:text-sky-400'
                                        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-50'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-primary dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Theme Toggle */}
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <ThemeToggle />
                    </div>

                    {/* Azure Badge */}
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#0078D4]/20 bg-[#0078D4]/5 px-3 py-2">
                        <svg width="14" height="14" viewBox="0 0 48 48" fill="#0078D4" xmlns="http://www.w3.org/2000/svg">
                            <path d="M28.17 4L16 22.39l12.38 14.56H48zM0 36.55l10.21 7.45h22.59l-5.35-7.45z" />
                        </svg>
                        <span className="text-xs font-bold text-[#0078D4] dark:text-sky-400">Powered by Azure</span>
                    </div>

                    {/* Teacher / Guest Profile + Logout */}
                    <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-sky-900/60 text-primary dark:text-sky-300 font-bold shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{isGuest ? 'Guest Access' : 'Lead Educator'}</div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 transition-colors"
                        >
                            <LogOut size={15} />
                            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Logout Confirmation Dialog ─────────────────── */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
                >
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-in fade-in zoom-in-95 duration-200">
                        {/* Icon */}
                        <div className="flex h-12 w-12 mx-auto mb-4 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                            <LogOut size={22} className="text-red-500 dark:text-red-400" />
                        </div>

                        <h2 className="text-center text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {isGuest ? 'Exit Guest Mode?' : 'Sign Out?'}
                        </h2>
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                            {isGuest
                                ? 'Your guest session will end and you\'ll be taken back to the home page.'
                                : 'Are you sure you want to sign out? You\'ll be redirected to the home page.'}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/20 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? (
                                    <span className="animate-pulse">Signing out…</span>
                                ) : (
                                    <>
                                        <LogOut size={14} />
                                        {isGuest ? 'Exit' : 'Sign Out'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
