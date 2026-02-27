'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserSquare, BrainCircuit } from 'lucide-react';
import clsx from 'clsx'; // Assuming standard CSS usage, or just tailwind template literals

const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Classes', href: '/classes', icon: Users },
    { name: 'Student Personas', href: '/students', icon: UserSquare },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform">
            <div className="flex h-full flex-col overflow-y-auto px-4 py-8">
                {/* Logo Area */}
                <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                        <BrainCircuit size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-800">
                        MindSim AI
                    </span>
                </Link>

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
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Teacher Profile Summary */}
                <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-primary font-bold">
                            TD
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Dr. Taylor</div>
                            <div className="text-xs text-slate-500">Lead Educator</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
