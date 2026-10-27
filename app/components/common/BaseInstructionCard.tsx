import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { CollapsibleCard } from '@components/shared/ui/collapsible-card';
import { cn } from '@components/shared/utils';
// The entity barrel imports this frame, so a barrel import would form a cycle.
import { ProgramField } from '@entities/instruction-card/ui/ProgramField';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';
import { Code } from 'react-feather';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseRawDetails, RawDetailsUnavailable } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';

type InstructionProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    childCards?: React.ReactNode;
    eventCards?: React.ReactNode[];
    childIndex?: number;
    // raw can be used to display raw instruction information
    raw?: TransactionInstruction;
    // will be triggered on requesting raw data for instruction, if present
    onRequestRaw?: () => void;
    // set when no request can produce `raw`, so the Raw view says so instead of omitting its rows
    rawUnavailable?: boolean;
    // Extra buttons rendered in the card header next to Raw
    headerButtons?: React.ReactNode;
    // Show a Collapse/Expand button that hides all card content
    collapsible?: boolean;
    // Check in the Raw view that the program exists and is executable
    validateProgram?: boolean;
};

export function BaseInstructionCard({
    title,
    children,
    result,
    index,
    ix,
    defaultRaw,
    eventCards,
    childCards,
    childIndex,
    raw,
    onRequestRaw,
    rawUnavailable,
    headerButtons,
    collapsible = false,
    validateProgram = false,
}: InstructionProps) {
    const [resultClass] = ixResult(result, index);
    const [showRaw, setShowRaw] = React.useState(defaultRaw || false);
    const rawClickHandler = () => {
        if (!defaultRaw && !showRaw && !raw) {
            // trigger handler to simulate behaviour for the `TxInstructionShell` for the transcation which contains logic in it to fetch raw transaction data
            onRequestRaw?.();
        }

        return setShowRaw(r => !r);
    };
    const scrollAnchorRef = useScrollAnchor(
        getInstructionCardScrollAnchorId(childIndex !== undefined ? [index + 1, childIndex + 1] : [index + 1]),
    );
    return (
        <CollapsibleCard
            ref={scrollAnchorRef}
            collapsible={collapsible}
            title={
                <span className="flex min-w-0 flex-1 items-center">
                    <Badge
                        ui="dashkit"
                        variant={resultClass as 'success' | 'warning' | 'dark'}
                        className="mr-1.5 flex-none"
                    >
                        #{index + 1}
                        {childIndex !== undefined ? `.${childIndex + 1}` : ''}
                    </Badge>
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{title}</span>
                </span>
            }
            headerButtons={
                <div className="flex items-center gap-1.5">
                    {headerButtons}
                    <Button
                        ui="dashkit"
                        size="sm"
                        variant={showRaw ? 'black' : 'white'}
                        active={showRaw}
                        disabled={defaultRaw}
                        className={cn('flex items-center', defaultRaw && '!pointer-events-auto cursor-not-allowed')}
                        onClick={rawClickHandler}
                    >
                        <Code className="mr-1.5" size={13} /> Raw
                    </Button>
                </div>
            }
        >
            <BaseTable ui="dashkit" variant="card" nowrap className={TABLE_CLASS}>
                <BaseTable.Body>
                    {showRaw ? (
                        <>
                            <ProgramField programId={ix.programId} showExtendedInfo={validateProgram} />
                            {'parsed' in ix ? (
                                <BaseRawParsedDetails ix={ix}>
                                    {raw ? (
                                        <BaseRawDetails ix={raw} />
                                    ) : rawUnavailable ? (
                                        <RawDetailsUnavailable />
                                    ) : null}
                                </BaseRawParsedDetails>
                            ) : (
                                <BaseRawDetails ix={ix} />
                            )}
                        </>
                    ) : (
                        children
                    )}
                    {childCards !== undefined && (
                        <>
                            <BaseTable.SectionRow>
                                <BaseTable.Cell colSpan={3}>Inner Instructions</BaseTable.Cell>
                            </BaseTable.SectionRow>
                            <BaseTable.Row>
                                <BaseTable.Cell colSpan={3}>
                                    <div>{childCards}</div>
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        </>
                    )}
                    {eventCards && eventCards.length > 0 && (
                        <>
                            <BaseTable.SectionRow>
                                <BaseTable.Cell colSpan={3}>Events</BaseTable.Cell>
                            </BaseTable.SectionRow>
                            <BaseTable.Row>
                                <BaseTable.Cell colSpan={3}>
                                    <div className="m-6">{eventCards}</div>
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        </>
                    )}
                </BaseTable.Body>
            </BaseTable>
        </CollapsibleCard>
    );
}

// Names and values wrap, so a long name or string does not widen the card past its frame.
// A full-width cell holds nested cards, so the rules skip it and nested names do not inherit `overflow-wrap`.
const TABLE_CLASS = cn(
    '[&>tbody>tr:first-child>td]:!border-t-0',
    '[&_td:first-child:not(:last-child)]:whitespace-normal',
    '[&_td:last-child:not(:first-child)]:whitespace-normal [&_td:last-child:not(:first-child)]:[overflow-wrap:anywhere]',
);

function ixResult(result: SignatureResult, index: number) {
    if (result.err) {
        const err = result.err as any;
        const ixError = err['InstructionError'];
        if (ixError && Array.isArray(ixError)) {
            const [errorIndex, error] = ixError;
            if (Number.isInteger(errorIndex) && errorIndex === index) {
                return ['warning', `Error: ${JSON.stringify(error)}`];
            }
        }
        return ['dark'];
    }
    return ['success'];
}
