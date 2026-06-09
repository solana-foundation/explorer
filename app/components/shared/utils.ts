import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Project uses the e- Tailwind prefix; without this config, twMerge can't recognize
// our classes as Tailwind utilities and won't dedupe conflicts (e.g. e-bg-transparent
// vs e-bg-[#1dd79b] would both survive, with source order picking the winner).
const twMerge = extendTailwindMerge({ prefix: 'e-' });

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
