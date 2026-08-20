import React from 'react';
import { ExternalLink } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

/**
 * Each primitive takes a `mono` flag: `true` renders in the monospace font (hashes, keys,
 * identifiers) and breaks on any char so a long run stays clipped; `false` uses the normal
 * body font and breaks on words (prose-y values like Message / dates / repo URLs).
 */

/** Scalar text value. `mono` picks the monospace vs. the normal body font. */
export function TextValue({ mono = true, children }: { mono?: boolean; children: React.ReactNode }) {
    return <span className={cn('min-w-0', mono ? 'break-all font-mono' : 'break-words')}>{children}</span>;
}

/** External link with a trailing open-in-new glyph. `mono` picks mono vs. the normal font. */
export function ExternalLinkValue({
    url,
    mono = true,
    children,
}: {
    url: string;
    mono?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <span className={cn('min-w-0', mono ? 'break-all font-mono' : 'break-words')}>
            <a rel="noopener noreferrer" target="_blank" href={url}>
                {children ?? url}
                {/* Raise the external-link glyph 2px above the text baseline. */}
                <ExternalLink className="relative -top-0.5 ml-1.5" size={13} />
            </a>
        </span>
    );
}

/** Vertical list of values (contacts, auditors) — one per line, left aligned. */
export function StackedList({ mono = true, children }: { mono?: boolean; children: React.ReactNode }) {
    return <ul className={cn('m-0 flex list-none flex-col gap-1 pl-0', mono && 'font-mono')}>{children}</ul>;
}

/** Preformatted block for PGP keys / code with no copy affordance. */
export function CodeBlock({ mono = true, children }: { mono?: boolean; children: React.ReactNode }) {
    return (
        <pre className={cn('mb-0 min-w-0 overflow-x-auto whitespace-pre-wrap break-words', mono && 'font-mono')}>
            {children}
        </pre>
    );
}
