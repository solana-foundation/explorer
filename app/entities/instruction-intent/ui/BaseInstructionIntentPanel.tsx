import { Button } from '@components/shared/ui/button';
import { Skeleton } from '@components/shared/ui/skeleton';
import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { getIntentUnavailableText, type InstructionIntent, type InstructionIntentResult } from '../lib/intent';
import { BaseIntentSentence } from './BaseIntentSentence';

type PanelIntent = Exclude<InstructionIntentResult, { status: 'idle' }>;

const panelVariants = cva('flex flex-col gap-2 whitespace-normal px-6 py-4 text-left', {
    defaultVariants: { tone: 'default' },
    variants: { tone: { danger: 'bg-dk-danger/5', default: 'bg-dark-background' } },
});

const labelVariants = cva('-mb-1 text-dk-xs font-medium uppercase tracking-[0.08em]', {
    defaultVariants: { tone: 'default' },
    variants: { tone: { danger: 'text-dk-danger', default: 'text-outer-space-300' } },
});

export function BaseInstructionIntentPanel({ intent, id }: { intent: PanelIntent; id: string }) {
    const tone = intent.status === 'failed' ? 'danger' : 'default';

    return (
        <div id={id} aria-live="polite" className={panelVariants({ tone })} data-testid="instruction-intent-panel">
            <span className={labelVariants({ tone })}>Intent</span>
            <PanelBody intent={intent} />
        </div>
    );
}

function PanelBody({ intent }: { intent: PanelIntent }) {
    switch (intent.status) {
        case 'loading':
            return (
                <div className="flex flex-col gap-2" data-testid="instruction-intent-loading">
                    <Skeleton className="h-3.5 w-[90%]" />
                    <Skeleton className="h-3.5 w-[55%]" />
                </div>
            );
        case 'ready':
            return <ReadyBody intent={intent.result} />;
        case 'failed':
            return (
                <div className="flex flex-col gap-2" data-testid="instruction-intent-failed">
                    <p className="m-0 text-sm text-neutral-300">Couldn&apos;t load the data the intent needs.</p>
                    {intent.retry && (
                        <div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={intent.retry}
                                data-testid="instruction-intent-retry"
                            >
                                Retry
                            </Button>
                        </div>
                    )}
                </div>
            );
        case 'unavailable':
            return (
                <p className="m-0 text-sm text-neutral-400" data-testid="instruction-intent-unavailable">
                    {getIntentUnavailableText(intent.reason)}
                </p>
            );
    }
}

function ReadyBody({ intent }: { intent: InstructionIntent }) {
    return (
        <>
            <BaseIntentSentence parts={intent.sentenceParts} />
            {!intent.interpolated && (
                <PanelNote>
                    Couldn&apos;t fill in the details for this instruction. The rows below carry them.
                </PanelNote>
            )}
            {intent.usedAccountData && (
                <PanelNote>Uses current account data, which may differ from the time of this transaction.</PanelNote>
            )}
        </>
    );
}

function PanelNote({ children }: { children: ReactNode }) {
    return <p className="m-0 text-xs text-outer-space-300">{children}</p>;
}
