import { Address } from '@components/common/Address';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { Badge } from '@shared/ui/badge';
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
                <span className="e-flex e-min-w-0 e-flex-1 e-items-center">
                    <Badge
                        ui="dashkit"
                        variant={resultClass as 'success' | 'warning' | 'dark'}
                        className="e-mr-1.5 e-flex-none"
                    >
                        #{index + 1}
                        {childIndex !== undefined ? `.${childIndex + 1}` : ''}
                    </Badge>
                    <span className="e-min-w-0 e-flex-1 e-overflow-hidden e-text-ellipsis e-whitespace-nowrap">
                        {title}
                    </span>
                </span>
            }
            headerButtons={
                <div className="e-flex e-items-center e-gap-1.5">
                    {headerButtons}
                    <button
                        disabled={defaultRaw}
                        className={cn(
                            'btn btn-sm e-flex e-items-center',
                            showRaw ? 'btn-black active' : 'btn-white',
                            defaultRaw && '!e-pointer-events-auto e-cursor-not-allowed',
                        )}
                        onClick={rawClickHandler}
                    >
                        <Code className="e-mr-1.5" size={13} /> Raw
                    </button>
                </div>
            }
        >
            <BaseTable ui="dashkit" variant="card" nowrap className="[&>tbody>tr:first-child>td]:!e-border-t-0">
                <BaseTable.Body className="list">
                    {showRaw ? (
                        <>
                            <BaseTable.Row>
                                <BaseTable.Cell>Program</BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">
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
                            <BaseTable.Row className="e-text-dk-xs e-uppercase e-tracking-[0.08em] e-text-dk-gray-600">
                                <BaseTable.Cell colSpan={3}>Inner Instructions</BaseTable.Cell>
                            </BaseTable.Row>
                            <BaseTable.Row>
                                <BaseTable.Cell colSpan={3}>
                                    {/* !e-m-0 overrides the 1.5rem margin from inner-cards
                                    so the card aligns with the "Inner Instructions" label above */}
                                    <div className="inner-cards !e-m-0">{innerCards}</div>
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        </>
                    )}
                    {eventCards && eventCards.length > 0 && (
                        <>
                            <BaseTable.Row className="e-text-dk-xs e-uppercase e-tracking-[0.08em] e-text-dk-gray-600">
                                <BaseTable.Cell colSpan={3}>Events</BaseTable.Cell>
                            </BaseTable.Row>
                            <BaseTable.Row>
                                <BaseTable.Cell colSpan={3}>
                                    <div className="inner-cards">{eventCards}</div>
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
