import { Badge } from '@components/shared/ui/badge';
import { CollapsibleCard } from '@components/shared/ui/collapsible-card';
import { cn } from '@components/shared/utils';
import { useScrollAnchor } from '@providers/scroll-anchor';
import type { SignatureResult } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { type InstructionPosition, positionLabel, positionNumbers } from '../model/node';

/** The chrome every instruction card shares, so a card with no instruction to show still matches its neighbours. */
export function InstructionCardFrame({
    title,
    result,
    position,
    collapsible = false,
    headerButtons,
    children,
}: {
    title: string;
    result: SignatureResult;
    position: InstructionPosition;
    collapsible?: boolean;
    headerButtons?: React.ReactNode;
    children: React.ReactNode;
}) {
    const badgeVariant = toBadgeVariant(result, position.index);
    const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId(positionNumbers(position)));
    return (
        <CollapsibleCard
            ref={scrollAnchorRef}
            collapsible={collapsible}
            title={
                <span className="flex min-w-0 flex-1 items-center">
                    <Badge ui="dashkit" variant={badgeVariant} className="mr-1.5 flex-none">
                        #{positionLabel(position)}
                    </Badge>
                    <span className="min-w-0 flex-1">{title}</span>
                </span>
            }
            headerButtons={headerButtons}
        >
            <BaseTable ui="dashkit" variant="card" nowrap className={TABLE_CLASS}>
                <BaseTable.Body>{children}</BaseTable.Body>
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

function toBadgeVariant(result: SignatureResult, index: number): 'success' | 'warning' | 'dark' {
    if (result.err) {
        const ixError =
            typeof result.err === 'object' && 'InstructionError' in result.err
                ? result.err.InstructionError
                : undefined;
        if (ixError && Array.isArray(ixError)) {
            const [errorIndex] = ixError;
            if (Number.isInteger(errorIndex) && errorIndex === index) {
                return 'warning';
            }
        }
        return 'dark';
    }
    return 'success';
}
