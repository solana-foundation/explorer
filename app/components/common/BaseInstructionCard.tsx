import { Address } from '@components/common/Address';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { cn } from '@shared/utils';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';
import { Code } from 'react-feather';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseRawDetails } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';

type InstructionProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    innerCards?: React.ReactNode[];
    eventCards?: React.ReactNode[];
    childIndex?: number;
    // raw can be used to display raw instruction information
    raw?: TransactionInstruction;
    // will be triggered on requesting raw data for instruction, if present
    onRequestRaw?: () => void;
    // Extra buttons rendered in the card header next to Raw
    headerButtons?: React.ReactNode;
    // Show a Collapse/Expand button that hides all card content
    collapsible?: boolean;
};

export function BaseInstructionCard({
    title,
    children,
    result,
    index,
    ix,
    defaultRaw,
    eventCards,
    innerCards,
    childIndex,
    raw,
    onRequestRaw,
    headerButtons,
    collapsible = false,
}: InstructionProps) {
    const [resultClass] = ixResult(result, index);
    const [showRaw, setShowRaw] = React.useState(defaultRaw || false);
    const rawClickHandler = () => {
        if (!defaultRaw && !showRaw && !raw) {
            // trigger handler to simulate behaviour for the InstructionCard for the transcation which contains logic in it to fetch raw transaction data
            onRequestRaw?.();
        }

        return setShowRaw(r => !r);
    };
    const scrollAnchorRef = useScrollAnchor(
        getInstructionCardScrollAnchorId(childIndex != null ? [index + 1, childIndex + 1] : [index + 1]),
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
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {title}
                    </span>
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
                        className={cn(
                            'flex items-center',
                            defaultRaw && '!pointer-events-auto cursor-not-allowed',
                        )}
                        onClick={rawClickHandler}
                    >
                        <Code className="mr-1.5" size={13} /> Raw
                    </Button>
                </div>
            }
        >
            <BaseTable ui="dashkit" variant="card" nowrap className="[&>tbody>tr:first-child>td]:!border-t-0">
                <BaseTable.Body>
                    {showRaw ? (
                        <>
                            <BaseTable.Row>
                                <BaseTable.Cell>Program</BaseTable.Cell>
                                <BaseTable.Cell className="text-right">
                                    <Address pubkey={ix.programId} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                            {'parsed' in ix ? (
                                <BaseRawParsedDetails ix={ix}>
                                    {raw ? <BaseRawDetails ix={raw} /> : null}
                                </BaseRawParsedDetails>
                            ) : (
                                <BaseRawDetails ix={ix} />
                            )}
                        </>
                    ) : (
                        children
                    )}
                    {innerCards && innerCards.length > 0 && (
                        <>
                            <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                                <BaseTable.Cell colSpan={3}>Inner Instructions</BaseTable.Cell>
                            </BaseTable.Row>
                            <BaseTable.Row>
                                <BaseTable.Cell colSpan={3}>
                                    <div>{innerCards}</div>
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        </>
                    )}
                    {eventCards && eventCards.length > 0 && (
                        <>
                            <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                                <BaseTable.Cell colSpan={3}>Events</BaseTable.Cell>
                            </BaseTable.Row>
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
