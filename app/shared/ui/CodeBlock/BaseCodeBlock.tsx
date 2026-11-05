import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Check, Copy, XCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import type { CopyState } from '@/app/shared/lib/useCopyToClipboard';

// `p-0`/`bg-transparent` beat the global `code, pre` chip rule so padding and surface stay on the root.
const preVariants = cva('bg-transparent', {
    defaultVariants: { variant: 'panel', wrap: 'nowrap' },
    variants: {
        variant: {
            panel: 'p-3',
            reference: 'px-0 py-2',
        },
        wrap: {
            nowrap: 'overflow-x-auto whitespace-pre',
            wrap: 'whitespace-pre-wrap break-words',
        },
    },
});

// `panel` is a framed surface. `reference` drops the frame and the surface for a sample that sits next to the
// page's main control as a reference: a thin left rule marks it as code without competing for attention.
const rootVariants = cva('', {
    defaultVariants: { variant: 'panel' },
    variants: {
        variant: {
            panel: 'overflow-hidden rounded-lg border border-solid border-outer-space-800 bg-heavy-metal-900',
            reference: 'border-0 border-l border-solid border-outer-space-800 pl-4',
        },
    },
});

const captionVariants = cva('flex items-center justify-between gap-2', {
    defaultVariants: { variant: 'panel' },
    variants: {
        variant: {
            panel: 'border-0 border-b border-solid border-outer-space-800 px-3 py-1.5',
            reference: 'pt-1',
        },
    },
});

// `reference` takes the page eyebrow shape (small uppercase) in the `KeyValue` label grey.
const captionTextVariants = cva('text-xs', {
    defaultVariants: { variant: 'panel' },
    variants: {
        variant: {
            panel: 'font-mono text-neutral-500',
            reference: 'font-normal uppercase text-outer-space-300',
        },
    },
});

const copyLabelByState: Record<CopyState, string> = {
    copied: 'Copied',
    copy: 'Copy code',
    errored: 'Copy failed',
};

export interface BaseCodeBlockProps
    // `dangerouslySetInnerHTML` is excluded alongside `children`: it spreads onto the div that renders them.
    extends
        Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'dangerouslySetInnerHTML'>,
        Omit<VariantProps<typeof preVariants>, 'wrap' | 'variant'>,
        VariantProps<typeof rootVariants> {
    caption?: string;
    code: string;
    copyState?: CopyState;
    /** Presence of a handler is what renders the copy control. */
    onCopy?: () => void;
    /** Markup shown in place of `code`, e.g. highlighted tokens; `code` stays the copied text. */
    rendered?: React.ReactNode;
    wrap?: 'nowrap' | 'wrap';
}

export function BaseCodeBlock({
    caption,
    className,
    code,
    copyState = 'copy',
    onCopy,
    rendered,
    variant,
    wrap,
    ...props
}: BaseCodeBlockProps) {
    const label = copyLabelByState[copyState];

    return (
        <div className={cn(rootVariants({ variant }), className)} {...props}>
            {(caption || onCopy) && (
                <div className={captionVariants({ variant })}>
                    <span className={captionTextVariants({ variant })}>{caption}</span>
                    {onCopy && (
                        <button
                            type="button"
                            aria-label={label}
                            onClick={onCopy}
                            // border-0 + explicit padding: the global button reset reverts UA chrome. Ring, not outline: `button:focus { outline: none !important }`.
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1 rounded border-0 bg-transparent px-1.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-heavy-metal-900',
                                copyState === 'errored'
                                    ? 'text-destructive'
                                    : 'text-neutral-400 hover:text-neutral-200',
                            )}
                        >
                            {copyState === 'copied' ? (
                                <Check size={14} aria-hidden />
                            ) : copyState === 'errored' ? (
                                <XCircle size={14} aria-hidden />
                            ) : (
                                <Copy size={14} aria-hidden />
                            )}
                        </button>
                    )}
                </div>
            )}

            <pre className={preVariants({ variant, wrap })}>
                <code className="bg-transparent p-0 font-mono text-xs leading-relaxed text-neutral-200">
                    {rendered ?? code}
                </code>
            </pre>

            {/* role="status" carries the polite live region; the button's own name change is not announced on its own. */}
            {onCopy && (
                <span role="status" className="sr-only">
                    {copyState === 'copy' ? '' : label}
                </span>
            )}
        </div>
    );
}

export { preVariants as baseCodeBlockVariants };
