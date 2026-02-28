'use client';

import { useState, useEffect } from 'react';

// Simple heuristic to guess gender from name (Hungarian/English focus)
export const guessGender = (fullName: string | undefined | null): 'boy' | 'girl' => {
    if (!fullName) return 'boy';
    const firstName = fullName.split(' ')[0].toLowerCase();
    // Common girl name endings
    if (firstName.endsWith('a') || firstName.endsWith('e') || firstName.endsWith('i') || firstName.endsWith('y')) {
        return 'girl';
    }
    return 'boy';
};

const EMOJIS = ['😀', '🤓', '🤔', '😎', '🤠', '👽', '🤖', '🦊', '🐱', '🐼', '🐵', '🦄', '🐸', '🦁', '🦉', '🐻', '🐰', '🐯', '🐙', '👾', '🚀', '🌟', '🌶️', '🍕', '🌵', '🌻'];

export function StudentAvatar({
    name,
    age,
    avatarUrl,
    className = "",
}: {
    name: string,
    age: number | string,
    avatarUrl?: string | null,
    className?: string,
}) {
    const [hasError, setHasError] = useState(false);
    const [emoji, setEmoji] = useState('😀');

    useEffect(() => {
        if (name) {
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % EMOJIS.length;
            setEmoji(EMOJIS[index]);
        }
    }, [name]);

    const defaultUrl = `https://wsrv.nl/?url=${encodeURIComponent(`avatar.iran.liara.run/public/${guessGender(name)}?username=${name}_${age}`)}`;
    const src = avatarUrl || defaultUrl;

    if (hasError) {
        return (
            <div className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700/50 w-full h-full pb-1 ${className}`}>
                <span className="text-[inherit] select-none">{emoji}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={`${name} avatar`}
            className={`w-full h-full object-cover ${className}`}
            onError={() => setHasError(true)}
        />
    );
}
