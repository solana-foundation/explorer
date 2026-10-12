'use client';

import { Copyable } from '@components/common/Copyable';
import { useMidTruncation } from '@components/common/useMidTruncation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { cn } from '@components/shared/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';

const truncatedValueVariants = cva('relative flex w-full min-w-0 justify-start overflow-x-hidden', {
    defaultVariants: {
        alignItems: 'center',
        alignRight: false,
    },
    variants: {
        alignItems: {
            center: 'items-center',
            start: 'items-start',
        },
        alignRight: {
            false: '',
            true: 'md:justify-end',
        },
    },
});

export type TruncationOptions = {
    enabled: boolean;
    midTruncateChars?: number;
};

export type TruncatedValueProps = {
    value: string;
    href?: string;
    truncation?: TruncationOptions;
    className?: string;
} & VariantProps<typeof truncatedValueVariants>;

/**
 * Mono-spaced long value (hash, signature, address) that mid-truncates once it overflows its row.
 * The full value stays reachable through the copy control and the tooltip.
 *
 * @example
 * ```tsx
 * <TruncatedValue value={hash} />
 * <TruncatedValue value={signature} href={`/tx/${signature}`} />
 * <TruncatedValue value={hash} truncation={{ enabled: false }} />
 * <TruncatedValue value={hash} truncation={{ enabled: true, midTruncateChars: 8 }} />
 * ```
 */
export function TruncatedValue({
    value,
    href,
    truncation = { enabled: true },
    alignItems,
    alignRight,
    className,
}: TruncatedValueProps) {
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(truncation.enabled, value, {
        midTruncateChars: truncation.midTruncateChars,
    });

    const visibleText = isMidTruncated ? midTruncatedText : value;

    return (
        <div ref={rowRef} className={cn(truncatedValueVariants({ alignItems, alignRight }), className)}>
            {truncation.enabled && (
                <span
                    ref={hiddenTextRef}
                    className="pointer-events-none invisible absolute whitespace-nowrap font-mono"
                    aria-hidden
                >
                    {value}
                </span>
            )}
            <Copyable text={value}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* A link is already focusable, so only the plain variant needs a tab stop, and only once truncation hides part of the value. */}
                        <span
                            tabIndex={isMidTruncated && !href ? 0 : undefined}
                            className="relative min-w-0 overflow-hidden font-mono"
                        >
                            {href ? (
                                <Link href={href} className="font-mono" aria-label={isMidTruncated ? value : undefined}>
                                    {visibleText}
                                </Link>
                            ) : (
                                <>
                                    <span className="font-mono" aria-hidden={isMidTruncated || undefined}>
                                        {visibleText}
                                    </span>
                                    {isMidTruncated && <span className="sr-only">{value}</span>}
                                </>
                            )}
                        </span>
                    </TooltipTrigger>
                    {isMidTruncated && (
                        <TooltipContent className="max-w-[min(320px,90vw)]">
                            <span className="break-all font-mono">{value}</span>
                        </TooltipContent>
                    )}
                </Tooltip>
            </Copyable>
        </div>
    );
}
