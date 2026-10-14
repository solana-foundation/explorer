'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, XCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { MONO_LABEL } from '../lib/mcp-docs-layout';

const CODE_CARD_COLLAPSED = 168;

export function CodeCard({
    code,
    collapsible,
    header,
    label,
}: {
    code: string;
    collapsible?: boolean;
    header?: React.ReactNode;
    label?: string;
}) {
    const [state, copy] = useCopyToClipboard(1000);

    const [expanded, setExpanded] = useState(false);
    const [fullHeight, setFullHeight] = useState(0);
    const preRef = useRef<HTMLPreElement>(null);

    const { isMd } = useBreakpoint();
    const isMobile = !isMd;

    useEffect(() => {
        if (!collapsible) return;
        const pre = preRef.current;
        if (!pre) return;
        const measure = () => setFullHeight(pre.scrollHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(pre);
        return () => observer.disconnect();
    }, [collapsible, code]);

    const icon = {
        copied: <Check size={14} aria-hidden />,
        copy: <Copy size={14} aria-hidden />,
        errored: <XCircle size={14} aria-hidden />,
    }[state];

    const clamped = collapsible && isMobile && !expanded;
    const preMaxHeight = collapsible && isMobile ? (expanded ? fullHeight : CODE_CARD_COLLAPSED) : undefined;

    return (
        <div className="w-full overflow-hidden rounded-lg border border-solid border-dark-border bg-outer-space-950">
            <div
                className={cn(
                    'flex w-full gap-2.5 px-5',
                    header ? 'items-stretch' : 'items-center py-3',
                    'border-0 border-b border-solid border-dark-border',
                )}
            >
                {header ?? (
                    <>
                        <span className={cn(MONO_LABEL, 'text-heavy-metal-500')}>{label}</span>
                        <span className="h-px flex-1" />
                    </>
                )}
                <button
                    type="button"
                    aria-label="Copy to clipboard"
                    onClick={() => copy(code)}
                    className={cn(
                        'flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-heavy-metal-500 hover:text-heavy-metal-300',
                        state === 'copied' && 'text-dark-accent hover:text-dark-accent',
                        state === 'errored' && 'text-red-500 hover:text-red-500',
                    )}
                >
                    {icon}
                </button>
            </div>
            <div className="relative">
                <pre
                    ref={preRef}
                    style={preMaxHeight === undefined ? undefined : { maxHeight: preMaxHeight }}
                    className={cn(
                        'm-0 whitespace-pre-wrap px-5 pb-5 pt-5 font-mono text-xs leading-6 text-dark-foreground [overflow-wrap:anywhere]',
                        collapsible && 'overflow-hidden transition-[max-height] duration-500 ease-in-out',
                    )}
                >
                    {code}
                </pre>

                {clamped && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                        style={{ backgroundImage: 'linear-gradient(to bottom, #0D121100 0%, #0D1211 92%)' }}
                    />
                )}
            </div>
            {collapsible && (
                <button
                    type="button"
                    onClick={() => setExpanded(value => !value)}
                    className={cn(
                        'flex w-full cursor-pointer items-center justify-center border-0 border-t border-solid border-dark-border',
                        'bg-transparent py-3 font-mono text-xs uppercase tracking-widest text-heavy-metal-300 hover:text-dark-foreground md:hidden',
                    )}
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
}
