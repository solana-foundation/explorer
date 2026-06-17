// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// No tailwind-merge: it no-op'd under the former `e-` prefix, so callers rely on "all classes
// kept, stylesheet-order wins". Enabling dedup app-wide is a deferred follow-up (expect drift).
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// Deduping variant (BaseCard dashkit consumers rely on className overriding base utilities).
// Was extendTailwindMerge({ prefix: 'e-' }): stock twMerge only recognizes unprefixed Tailwind
// classes, so under the `e-` prefix it couldn't see conflicts and skipped dedupe — the config
// taught it the prefix. Plain twMerge now that the prefix is gone.
export const cnPrefixed = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
