'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type RefObject, useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CheckCircle, X } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

import { FEEDBACK_SENT, type FeedbackFormValues } from '../model/use-feedback-form';
import { type PlayedSequence, playSwapExit } from './feedback-sent-motion';
import { FeedbackTopics } from './FeedbackTopics';
import { canAnimate, prefersReducedMotion } from './motion-support';
import { SentCloseButton } from './SentCloseButton';

export interface FeedbackPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originRef: RefObject<HTMLElement | null>;
    bugReportUrl: string;
    ideasUrl: string;
    onSubmitFeedback?: (values: FeedbackFormValues) => Promise<boolean>;
    isSubmitting?: boolean;
}

export function FeedbackPopup({
    open,
    onOpenChange,
    originRef,
    bugReportUrl,
    ideasUrl,
    onSubmitFeedback,
    isSubmitting = false,
}: FeedbackPopupProps) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const closingRef = useRef(false);
    const [sendFailed, setSendFailed] = useState(false);
    const [swapped, setSwapped] = useState(false);
    const swapCloseRef = useRef<HTMLButtonElement | null>(null);
    const swapRingRef = useRef<SVGRectElement | null>(null);
    const endSentRef = useRef<(() => void) | undefined>(undefined);

    const finish = () => {
        endSentRef.current = undefined;
        setSendFailed(false);
        setSwapped(false);
        onOpenChange(false);
    };

    const attachPanel = useCallback(
        (node: HTMLDivElement | null) => {
            panelRef.current = node;
            if (!node) return;
            closingRef.current = false;
            if (skipMotion()) return;
            playPop(
                { content: contentRef.current, overlay: overlayRef.current, panel: node },
                originFrame(originRef.current, node),
                'open',
            );
        },
        [originRef],
    );

    const close = (outcome: 'dismissed' | 'sent' = 'dismissed') => {
        if (endSentRef.current) {
            endSentRef.current();
            return;
        }
        if (closingRef.current) return;
        closingRef.current = true;
        const panel = panelRef.current;
        if (outcome === 'sent') {
            swapToSent(panel);
            return;
        }
        if (!panel || skipMotion()) {
            finish();
            return;
        }
        playPop(
            { content: contentRef.current, overlay: overlayRef.current, panel },
            originFrame(originRef.current, panel),
            'close',
        ).then(finish, finish);
    };

    const playCutShort = (played: PlayedSequence) => {
        let ended = false;
        const end = (early: boolean) => {
            if (ended) return;
            ended = true;
            endSentRef.current = undefined;
            if (early) played.cutShort().then(finish, finish);
            else finish();
        };
        endSentRef.current = () => end(true);
        played.done.then(
            () => end(false),
            () => end(false),
        );
    };

    const swapToSent = (panel: HTMLElement | null) => {
        if (!panel) {
            finish();
            return;
        }
        panel.style.height = `${panel.offsetHeight}px`;
        flushSync(() => setSwapped(true));
        swapCloseRef.current?.focus();
        if (!canAnimate()) {
            finish();
            return;
        }
        playCutShort(
            playSwapExit(
                { overlay: overlayRef.current, panel, ring: swapRingRef.current },
                prefersReducedMotion(),
                POP_EASE,
            ),
        );
    };

    const handleSubmit = (values: FeedbackFormValues) => {
        setSendFailed(false);
        void onSubmitFeedback?.(values).then(delivered => {
            if (delivered) close('sent');
            else setSendFailed(true);
        });
    };

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={next => {
                if (!next) close();
            }}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    ref={overlayRef}
                    className="fixed inset-x-0 -top-[50vh] z-50 h-[200vh] bg-black/70"
                />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 py-24 outline-none"
                    onClick={event => {
                        if (endSentRef.current || event.target === event.currentTarget) close();
                    }}
                >
                    <div
                        ref={attachPanel}
                        className={cn(
                            'relative max-h-full w-[min(448px,calc(100vw-32px))] overflow-y-auto border border-solid shadow-2xl',
                            swapped
                                ? 'cursor-pointer rounded-lg border-dark-accent bg-dark-accent transition-[background-color,border-color] duration-200'
                                : 'rounded-lg border-outer-space-800 bg-outer-space-900',
                        )}
                    >
                        {swapped ? (
                            <div className="flex h-full flex-col items-center p-6 text-center">
                                <DialogPrimitive.Title className="sr-only">Feedback</DialogPrimitive.Title>
                                <DialogPrimitive.Description className="sr-only">
                                    {FEEDBACK_SENT.description}
                                </DialogPrimitive.Description>
                                <div
                                    role="status"
                                    className="flex flex-1 flex-col items-center justify-center gap-2 animate-in fade-in [animation-duration:200ms]"
                                >
                                    <CheckCircle className="mb-1 text-dark-background" size={48} aria-hidden="true" />
                                    <p className="m-0 text-3xl font-semibold leading-tight text-dark-background">
                                        {FEEDBACK_SENT.title}
                                    </p>
                                    <p className="m-0 text-base text-dark-background">{FEEDBACK_SENT.description}</p>
                                </div>
                                <SentCloseButton
                                    buttonRef={swapCloseRef}
                                    ringRef={swapRingRef}
                                    onClose={() => close()}
                                />
                            </div>
                        ) : (
                            <>
                                <div ref={contentRef} className="flex flex-col gap-3 p-5 pt-6">
                                    <div className="flex flex-col gap-1.5 pr-6">
                                        <DialogPrimitive.Title className="m-0 text-xl font-medium leading-snug text-white">
                                            Feedback
                                        </DialogPrimitive.Title>
                                        <DialogPrimitive.Description className="m-0 text-sm text-outer-space-300">
                                            What would you like to share?
                                        </DialogPrimitive.Description>
                                    </div>
                                    <FeedbackTopics
                                        bugReportUrl={bugReportUrl}
                                        error={sendFailed}
                                        ideasUrl={ideasUrl}
                                        isSubmitting={isSubmitting}
                                        onNavigateAway={() => close()}
                                        onSubmit={handleSubmit}
                                        showForm={Boolean(onSubmitFeedback)}
                                    />
                                </div>
                                <button
                                    aria-label="Close"
                                    className="absolute right-3.5 top-3.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-outer-space-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outer-space-300"
                                    onClick={() => close()}
                                    type="button"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

const POP_MS = 300;
const POP_EASE = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
const FALLBACK_MS = 160;

function originFrame(origin: HTMLElement | null, panel: HTMLElement): Keyframe | undefined {
    const transform = morphTransform(origin, panel);
    return transform ? { opacity: 0.9, transform } : undefined;
}

function morphTransform(origin: HTMLElement | null, panel: HTMLElement): string | undefined {
    const from = origin?.getBoundingClientRect();
    if (!from || from.width === 0) return undefined;

    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const dx = from.left + from.width / 2 - (panel.offsetLeft + width / 2);
    const dy = from.top + from.height / 2 - (panel.offsetTop + height / 2);
    return `translate(${dx}px, ${dy}px) scale(${from.width / width}, ${from.height / height})`;
}

function playPop(
    layers: { panel: HTMLElement; content: HTMLElement | null; overlay: HTMLElement | null },
    edge: Keyframe | undefined,
    direction: 'open' | 'close',
): Promise<unknown> {
    const timing: KeyframeAnimationOptions = {
        direction: direction === 'open' ? 'normal' : 'reverse',
        duration: edge ? POP_MS : FALLBACK_MS,
        fill: direction === 'close' ? 'forwards' : 'none',
    };
    const animations = [
        layers.panel.animate([edge ?? { opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], {
            ...timing,
            easing: edge ? POP_EASE : 'linear',
        }),
        ...(edge && layers.content
            ? [layers.content.animate([{ opacity: 0 }, { offset: 0.35, opacity: 0 }, { opacity: 1 }], timing)]
            : []),
        ...(layers.overlay
            ? [layers.overlay.animate([{ opacity: 0 }, { offset: 0.6, opacity: 1 }, { opacity: 1 }], timing)]
            : []),
    ];
    return Promise.all(animations.map(animation => animation.finished));
}

function skipMotion(): boolean {
    return !canAnimate() || prefersReducedMotion();
}
