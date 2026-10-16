import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { InstructionIntentButton, InstructionIntentRow } from '@entities/instruction-intent/@x/instruction-card';
import { SignatureResult } from '@solana/web3.js';
import React from 'react';
import { Code } from 'react-feather';

import { BaseTable } from '@/app/shared/ui/Table';

import type { InstructionEvent } from '../model/events';
import type { InstructionNode } from '../model/node';
import type { RawSource } from '../model/raw-source';
import { BaseRawDetails, RawDetailsUnavailable } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';
import { EventRows } from './EventRows';
import { InstructionCardFrame } from './InstructionCardFrame';
import { InstructionNodeCards } from './InstructionNodeCards';
import { ProgramField } from './ProgramField';

type BaseInstructionCardProps = {
    node: InstructionNode;
    title: string;
    result: SignatureResult;
    rawSource: RawSource;
    collapsible: boolean;
    validateProgram: boolean;
    events?: readonly InstructionEvent[];
    children?: React.ReactNode;
};

export function BaseInstructionCard({
    node,
    title,
    result,
    rawSource,
    collapsible,
    validateProgram,
    events,
    children,
}: BaseInstructionCardProps) {
    const rawOnly = children === undefined;
    const [showRaw, setShowRaw] = React.useState(rawOnly);
    const toggleRaw = () => {
        if (!showRaw && 'fetch' in rawSource) {
            rawSource.fetch();
        }
        setShowRaw(r => !r);
    };
    const { ix } = node;
    // Inner cards render inside the provider of their parent, so only a top-level card shows the intent
    const isTopLevel = node.childIndex === undefined;

    return (
        <InstructionCardFrame
            title={title}
            result={result}
            position={node}
            collapsible={collapsible}
            headerButtons={
                <div className="flex items-center gap-1.5">
                    {isTopLevel && <InstructionIntentButton />}
                    <Button
                        ui="dashkit"
                        size="sm"
                        variant={showRaw ? 'black' : 'white'}
                        active={showRaw}
                        disabled={rawOnly}
                        className={cn('flex items-baseline', rawOnly && '!pointer-events-auto cursor-not-allowed')}
                        onClick={toggleRaw}
                    >
                        <Code className="mr-1.5 self-center" size={13} /> Raw
                    </Button>
                </div>
            }
        >
            {isTopLevel && <InstructionIntentRow />}
            {showRaw ? (
                <>
                    <ProgramField programId={node.programId} validateProgram={validateProgram} />
                    {'parsed' in ix ? (
                        <BaseRawParsedDetails ix={ix}>
                            {rawSource.kind === 'instruction' && <BaseRawDetails ix={rawSource.ix} />}
                            {(rawSource.kind === 'unavailable' || rawSource.kind === 'failed') && (
                                <RawDetailsUnavailable />
                            )}
                        </BaseRawParsedDetails>
                    ) : (
                        <BaseRawDetails ix={ix} />
                    )}
                </>
            ) : (
                children
            )}
            {node.children && node.children.length > 0 && (
                <>
                    <BaseTable.SectionRow>
                        <BaseTable.Cell colSpan={3}>Inner Instructions</BaseTable.Cell>
                    </BaseTable.SectionRow>
                    <BaseTable.Row>
                        <BaseTable.Cell colSpan={3}>
                            <div>
                                <InstructionNodeCards nodes={node.children} parent={node} />
                            </div>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            )}
            {events && events.length > 0 && <EventRows events={events} position={node} showRaw={showRaw} />}
        </InstructionCardFrame>
    );
}
