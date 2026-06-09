import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// `prefix: 'e-'` matches the project's Tailwind config; without it, twMerge can't
// recognize our classes and won't dedupe conflicts (e.g. e-bg-transparent vs
// e-bg-[#1dd79b] would both survive, with source order picking the winner).
//
// Pinned to tailwind-merge@^2 because v3.0.0 dropped support for Tailwind v3's
// prefix-at-start syntax in favor of v4's positioning. We're still on Tailwind v3
// — re-evaluate this pin when migrating to Tailwind v4.
const twMerge = extendTailwindMerge({ prefix: 'e-' });

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
