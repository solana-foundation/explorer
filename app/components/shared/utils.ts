import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge, twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Configured tailwind-merge helper that recognizes this project's `e-` Tailwind prefix
 * and properly dedupes conflicting prefixed utilities (e.g. `e-bg-transparent` vs `e-bg-[#1dd79b]`
 * → keeps only `e-bg-[#1dd79b]`).
 *
 * Currently UNUSED — the default `cn` above intentionally skips dedup of prefixed classes
 * because enabling project-wide dedup surfaces a long tail of consumer code that relies on
 * the legacy "both classes kept, source-order wins" behavior. Swap `cn` to call this helper
 * in a dedicated follow-up PR (capture-and-fix the resulting visual drift).
 *
 * Requires tailwind-merge ^2.x. v3.0.0 dropped Tailwind v3's prefix-at-start syntax in
 * favor of Tailwind v4 positioning, so re-evaluate this helper when migrating to Tailwind v4.
 */
export const cnPrefixed = (() => {
    const merge = extendTailwindMerge({ prefix: 'e-' });
    return (...inputs: ClassValue[]) => merge(clsx(inputs));
})();
