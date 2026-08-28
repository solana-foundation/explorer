import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Check, Copy, XCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import type { CopyState } from '@/app/shared/lib/useCopyToClipboard';

// `p-0`/`bg-transparent` beat the global `code, pre` chip rule so padding and surface stay on the root.
const preVariants = cva('bg-transparent p-3', {
    defaultVariants: { wrap: 'nowrap' },
    variants: {
        wrap: {
            nowrap: 'overflow-x-auto whitespace-pre',
            wrap: 'whitespace-pre-wrap break-words',
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
        Omit<VariantProps<typeof preVariants>, 'wrap'> {
    caption?: string;
    code: string;
    copyState?: CopyState;
    /** Presence of a handler is what renders the copy control. */
    onCopy?: () => void;
    wrap?: 'nowrap' | 'wrap';
}

export function BaseCodeBlock({
    caption,
    className,
    code,
    copyState = 'copy',
    onCopy,
    wrap,
    ...props
}: BaseCodeBlockProps) {
    const label = copyLabelByState[copyState];

    return (
        <div
            className={cn(
                'overflow-hidden rounded-lg border border-solid border-heavy-metal-950 bg-heavy-metal-900',
                className,
            )}
            {...props}
        >
            {(caption || onCopy) && (
                <div className="flex items-center justify-between gap-2 border-0 border-b border-solid border-heavy-metal-950 px-3 py-1.5">
                    <span className="font-mono text-xs text-neutral-500">{caption}</span>
                    {onCopy && (
                        <button
                            type="button"
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
                            {label}
                        </button>
                    )}
                </div>
            )}

            <pre className={preVariants({ wrap })}>
                <code className="bg-transparent p-0 font-mono text-xs leading-relaxed text-neutral-200">{code}</code>
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
