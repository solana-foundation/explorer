'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link2, RotateCcw } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { useReducedMotion } from '@/app/shared/lib/use-reduced-motion';

import { answerCost, MCP_EXAMPLES, type McpExample, revealAnswer, type RevealedBlock } from '../lib/example-answers';
import { MONO_LABEL } from '../lib/mcp-docs-layout';
import { useStickToBottom } from '../lib/useStickToBottom';

export function Examples() {
    const [picked, setPicked] = useState<McpExample | undefined>(undefined);

    const { isMd } = useBreakpoint();
    const boxRef = useRef<HTMLDivElement>(null);
    const firstChoiceRef = useRef<HTMLButtonElement>(null);

    const pendingBottom = useRef<number | undefined>(undefined);

    const handleReset = () => {
        pendingBottom.current = boxRef.current?.getBoundingClientRect().bottom;
        setPicked(undefined);
    };

    useLayoutEffect(() => {
        if (picked !== undefined) return;
        const target = pendingBottom.current;
        pendingBottom.current = undefined;
        const box = boxRef.current;
        if (target === undefined || !box) return;
        firstChoiceRef.current?.focus({ preventScroll: true });
        if (!isMd) {
            const delta = box.getBoundingClientRect().top - CHAT_TOP_GAP;
            if (delta !== 0) window.scrollBy({ behavior: 'smooth', top: delta });
            return;
        }
        const delta = box.getBoundingClientRect().bottom - target;
        if (delta !== 0) window.scrollBy(0, delta);
    }, [picked, isMd]);

    return (
        <>
            <div
                ref={boxRef}
                className="w-full overflow-hidden rounded-xl border border-solid border-dark-border bg-heavy-metal-900 shadow-[0px_14px_36px_-12px_#00000073]"
            >
                <div className="flex w-full items-center gap-2.5 border-0 border-b border-solid border-dark-border px-3.5 py-3 sm:px-5 sm:py-3.5">
                    <span className={cn(MONO_LABEL, 'text-heavy-metal-500')}>MCP examples</span>
                    <span className="h-px flex-1" />
                    <span className="font-mono text-xs tracking-wider text-heavy-metal-500">
                        mainnet-beta · read-only
                    </span>
                </div>
                {picked === undefined ? (
                    <ExamplePicker firstChoiceRef={firstChoiceRef} onPick={setPicked} />
                ) : (
                    <ExampleAnswer key={picked.id} boxRef={boxRef} example={picked} onReset={handleReset} />
                )}
            </div>
        </>
    );
}

function ExamplePicker({
    firstChoiceRef,
    onPick,
}: {
    firstChoiceRef: React.RefObject<HTMLButtonElement | null>;
    onPick: (example: McpExample) => void;
}) {
    return (
        <div className="flex min-h-[440px] w-full flex-col items-center p-4 sm:px-7 sm:py-6">
            <div className="flex w-full flex-1 items-center justify-center">
                <p className="m-0 max-w-xl py-7 text-center text-base leading-6 text-dark-foreground sm:py-0 sm:text-lg sm:leading-7">
                    I can read any account, program, token mint or transaction on mainnet-beta — decoded, not raw. Pick
                    a question to start.
                </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-6">
                <span className={cn(MONO_LABEL, 'text-center text-heavy-metal-300')}>Try it</span>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {MCP_EXAMPLES.map((example, index) => (
                        <button
                            key={example.id}
                            ref={index === 0 ? firstChoiceRef : undefined}
                            type="button"
                            onClick={() => onPick(example)}
                            className={cn(
                                'flex cursor-pointer items-center rounded-[12px_12px_4px_12px] border border-solid px-4 py-3 text-left text-sm leading-5',
                                'border-dark-border bg-transparent text-heavy-metal-300 transition-colors',

                                'hover:border-dark-accent hover:bg-accent-900 hover:text-dark-accent',
                                'focus-visible:border-dark-accent focus-visible:bg-accent-900 focus-visible:text-dark-accent',
                                'sm:min-h-[90px]',
                            )}
                        >
                            {example.prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const SENDING_MS = 320;
const THINKING_MS = 317;

const TYPING_SPEED = 260;

const CHAT_TOP_GAP = 20;

type ChatPhase = 'sending' | 'thinking' | 'typing' | 'done';

function ExampleAnswer({
    boxRef,
    example,
    onReset,
}: {
    boxRef: React.RefObject<HTMLDivElement | null>;
    example: McpExample;
    onReset: () => void;
}) {
    const reduced = useReducedMotion();
    const [phase, setPhase] = useState<ChatPhase>('sending');
    const [revealed, setRevealed] = useState(0);

    const total = useMemo(() => answerCost(example.answer), [example.answer]);

    useStickToBottom(boxRef, { follow: phase === 'typing', settle: phase === 'done', smooth: !reduced });

    useEffect(() => {
        if (reduced) {
            setPhase('done');
            return;
        }
        const toThinking = setTimeout(() => setPhase('thinking'), SENDING_MS);
        const toTyping = setTimeout(() => setPhase('typing'), SENDING_MS + THINKING_MS);
        return () => {
            clearTimeout(toThinking);
            clearTimeout(toTyping);
        };
    }, [reduced]);

    useEffect(() => {
        if (phase === 'done') {
            setRevealed(total);
            return;
        }
        if (phase !== 'typing') return;

        let frame = 0;
        let startedAt = 0;
        const step = (now: number) => {
            startedAt ||= now;
            const next = Math.min(total, ((now - startedAt) / 1000) * TYPING_SPEED);
            setRevealed(next);
            if (next < total) {
                frame = requestAnimationFrame(step);
            } else {
                setPhase('done');
            }
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [phase, total]);

    const blocks = phase === 'done' ? revealAnswer(example.answer, total) : revealAnswer(example.answer, revealed);
    const answering = phase === 'typing' || phase === 'done';

    return (
        <div className="flex min-h-[440px] w-full flex-col">
            <div className="mt-auto flex w-full flex-col gap-3.5 p-4 sm:p-7">
                <div className="flex w-full justify-end">
                    <div
                        className={cn(
                            'max-w-xl rounded-[12px_12px_4px_12px] bg-accent-900 px-4 py-3 text-sm leading-5 text-dark-foreground [overflow-wrap:anywhere]',
                            !reduced && 'duration-300 animate-in fade-in slide-in-from-bottom-2',
                        )}
                    >
                        {example.question}
                    </div>
                </div>

                {phase === 'thinking' && <ThinkingBubble />}

                {answering && (
                    <>
                        <div
                            className={cn(
                                'flex w-fit items-center gap-2 font-mono text-xs text-heavy-metal-500',
                                !reduced && 'duration-300 animate-in fade-in',
                            )}
                        >
                            <Link2 size={12} aria-hidden />
                            Ran {example.tool} · Explorer MCP
                        </div>
                        <div
                            aria-live="polite"
                            aria-busy={phase === 'typing'}
                            className="flex w-full max-w-3xl flex-col gap-3.5 rounded-[12px_12px_12px_4px] border border-solid border-dark-border bg-outer-space-950 p-3.5 sm:px-5 sm:py-4"
                        >
                            {blocks.map((revealedBlock, index) => (
                                <AnswerBlockView
                                    key={index}
                                    revealed={revealedBlock}
                                    caret={phase === 'typing' && index === blocks.length - 1}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {phase === 'done' && (
                <div
                    className={cn(
                        'flex w-full items-center justify-center border-0 border-t border-solid border-dark-border px-5 py-3.5',
                        !reduced && 'duration-300 animate-in fade-in',
                    )}
                >
                    <button
                        type="button"
                        onClick={onReset}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md border border-solid border-dark-border bg-outer-space-950 px-5 py-2.5 text-sm text-heavy-metal-300 hover:text-dark-foreground"
                    >
                        <RotateCcw size={13} aria-hidden />
                        Ask other question
                    </button>
                </div>
            )}
        </div>
    );
}

function ThinkingBubble() {
    return (
        <div className="flex w-fit items-center gap-1.5 rounded-[12px_12px_12px_4px] border border-solid border-dark-border bg-outer-space-950 px-4 py-3.5">
            <span className="sr-only">Thinking…</span>
            {[0, 140, 280].map(delay => (
                <span
                    key={delay}
                    aria-hidden
                    className="size-1.5 animate-bounce rounded-full bg-heavy-metal-500"
                    style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
                />
            ))}
        </div>
    );
}

function AnswerBlockView({ caret, revealed }: { caret: boolean; revealed: RevealedBlock }) {
    const { block } = revealed;

    if (block.kind === 'text') {
        return (
            <p className="m-0 text-sm leading-6 text-dark-foreground [overflow-wrap:anywhere]">
                {revealed.text}
                {caret && <TypingCaret />}
            </p>
        );
    }

    const rows = block.rows.slice(0, revealed.rows);

    return (
        <>
            {/* A multi-column table can't fit a phone, so below sm each row stacks as labelled key/value pairs. */}
            <div className="rounded-lg border border-solid border-dark-border sm:hidden">
                {rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={cn(
                            'flex flex-col gap-2 p-3',
                            rowIndex > 0 && 'border-0 border-t border-solid border-dark-border',
                        )}
                    >
                        {row.map((cell, columnIndex) => (
                            <div key={columnIndex} className="flex flex-col gap-1">
                                <span className="font-mono text-xs uppercase leading-4 tracking-widest text-heavy-metal-500">
                                    {block.head[columnIndex]}
                                </span>
                                <span className="text-sm leading-5 text-dark-foreground [overflow-wrap:anywhere]">
                                    {cell}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="hidden w-full overflow-hidden rounded-lg border border-solid border-dark-border sm:block">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-heavy-metal-900">
                            {block.head.map((title, index) => (
                                <th
                                    key={index}
                                    className={cn(
                                        'border-0 border-r border-solid border-dark-border last:border-r-0',
                                        rows.length > 0 && 'border-b',
                                        'px-3 py-2.5 text-left font-mono text-xs font-normal uppercase leading-4 tracking-widest text-heavy-metal-500',
                                        index === 0 && 'whitespace-nowrap',
                                    )}
                                >
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-0 border-b border-solid border-dark-border last:border-b-0"
                            >
                                {row.map((cell, index) => (
                                    <td
                                        key={index}
                                        className={cn(
                                            'border-0 border-r border-solid border-dark-border last:border-r-0',
                                            'px-3 py-2.5 align-top text-sm leading-5 text-dark-foreground [overflow-wrap:anywhere]',
                                            index === 0 && 'whitespace-nowrap',
                                        )}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function TypingCaret() {
    return (
        <span
            aria-hidden
            className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse bg-dark-accent"
        />
    );
}
