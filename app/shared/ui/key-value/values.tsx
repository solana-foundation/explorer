import { cva } from 'class-variance-authority';
import React from 'react';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

import { ExternalLink } from '@/app/components/shared/ui/external-link';

/**
 * Each primitive takes a `mono` flag: `true` renders in the monospace font (hashes, keys,
 * identifiers) and breaks on any char so a long run stays clipped; `false` uses the normal
 * body font and breaks on words (prose-y values like Message / dates / repo URLs).
 */

// The shared `mono` split: monospace + break-on-any-char vs. body font + break-on-words.
const textValueVariants = cva('min-w-0', {
    defaultVariants: { mono: true, preserveWhitespace: false },
    variants: {
        mono: {
            false: 'break-words',
            true: 'break-all font-mono',
        },
        preserveWhitespace: {
            false: '',
            true: 'whitespace-pre-wrap',
        },
    },
});

const linkValueVariants = cva('min-w-0', {
    defaultVariants: { mono: true },
    variants: {
        mono: {
            false: 'break-words',
            true: 'break-all font-mono',
        },
    },
});

const stackedListVariants = cva('m-0 flex list-none flex-col gap-1 pl-0', {
    defaultVariants: { mono: true },
    variants: {
        mono: {
            false: '',
            true: 'font-mono',
        },
    },
});

const codeBlockVariants = cva('mb-0 min-w-0 overflow-x-auto whitespace-pre-wrap break-words', {
    defaultVariants: { mono: true },
    variants: {
        mono: {
            false: '',
            true: 'font-mono',
        },
    },
});

/**
 * Scalar text value. `mono` picks the monospace vs. the normal body font. `preserveWhitespace` keeps
 * significant spaces/newlines (whitespace-pre-wrap) instead of collapsing them — for values like a
 * verified-build `message` where internal spacing is meaningful.
 */
export function TextValue({
    mono = true,
    preserveWhitespace = false,
    children,
}: {
    mono?: boolean;
    preserveWhitespace?: boolean;
    children: React.ReactNode;
}) {
    return <span className={textValueVariants({ mono, preserveWhitespace })}>{children}</span>;
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
        <span className={linkValueVariants({ mono })}>
            {/* Delegate to the safe ExternalLink, which scheme-checks the (on-chain, attacker-controlled)
                url and owns rel/target — so a javascript:/data: href can never reach the DOM here. */}
            <ExternalLink href={url}>
                {children ?? url}
                {/* Raise the external-link glyph 2px above the text baseline. */}
                <ExternalLinkIcon className="relative -top-0.5 ml-1.5" size={13} />
            </ExternalLink>
        </span>
    );
}

/** Vertical list of values (contacts, auditors) — one per line, left aligned. */
export function StackedList({ mono = true, children }: { mono?: boolean; children: React.ReactNode }) {
    return <ul className={stackedListVariants({ mono })}>{children}</ul>;
}

/** Preformatted block for PGP keys / code with no copy affordance. */
export function CodeBlock({ mono = true, children }: { mono?: boolean; children: React.ReactNode }) {
    return <pre className={codeBlockVariants({ mono })}>{children}</pre>;
}
