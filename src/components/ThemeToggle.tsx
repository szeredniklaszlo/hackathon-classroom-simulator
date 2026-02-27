'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-50"
        >
            {theme === 'dark' ? (
                <>
                    <Sun size={20} className="text-amber-400" />
                    <span>Light Mode</span>
                </>
            ) : (
                <>
                    <Moon size={20} className="text-slate-400" />
                    <span>Dark Mode</span>
                </>
            )}
        </button>
    );
}
