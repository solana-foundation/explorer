'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { cva } from 'class-variance-authority';

import { Copyable } from './Copyable';
import { useMidTruncation } from './useMidTruncation';

const HASH_MID_TRUNCATE_CHARS = 8;

const hashValueVariants = cva('relative flex w-full min-w-0 items-center justify-start', {
    defaultVariants: {
        alignRight: false,
    },
    variants: {
        alignRight: {
            false: '',
            true: 'md:justify-end',
        },
    },
});

type Props = {
    value: string;
    alignRight?: boolean;
};

export function HashValue({ value, alignRight }: Props) {
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(true, value, {
        midTruncateChars: HASH_MID_TRUNCATE_CHARS,
    });

    const visibleText = isMidTruncated ? midTruncatedText : value;

    return (
        <div ref={rowRef} className={hashValueVariants({ alignRight: Boolean(alignRight) })}>
            <span
                ref={hiddenTextRef}
                className="pointer-events-none invisible absolute whitespace-nowrap font-mono"
                aria-hidden
            >
                {value}
            </span>
            <Copyable text={value}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span aria-label={value} className="relative min-w-0 overflow-hidden font-mono">
                            {visibleText}
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
