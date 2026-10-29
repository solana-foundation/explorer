import React from 'react';

import { InstructionCardView } from '../ui/InstructionCardView';
import { InstructionFields } from '../ui/InstructionFields';
import type { InstructionFieldList } from './fields';
import type { InstructionNode } from './node';

export type InstructionCardProps<I> = { node: InstructionNode; info: I };

export type InstructionCardSpec<I> = {
    /** A function when the title depends on the decoded payload. */
    title: string | ((info: I) => string);
    fields: (info: I) => InstructionFieldList;
};

/**
 * Builds a card from a declaration of what it shows.
 *
 * This is the shorthand for the common label/value shape, not a required
 * abstraction. `title` and `fields` are plain functions, so a card whose content
 * depends on a **hook** cannot use it — that covers async values (token amounts
 * needing mint decimals) and program events (read from transaction logs).
 *
 * Such a card writes its own component and still declares its rows as fields:
 *
 * ```tsx
 * type TokenTransferInfo = { source: PublicKey; mint: string; amount: string };
 *
 * export function TokenTransferCard({ node, info }: InstructionCardProps<TokenTransferInfo>) {
 *     const mint = useMintAccountInfo(info.mint);
 *     return (
 *         <InstructionCardView node={node} title="Token: Transfer">
 *             <InstructionFields
 *                 programId={node.programId}
 *                 fields={[
 *                     address('From', info.source),
 *                     // Decimals arrive asynchronously, so show the raw amount until they land.
 *                     text('Amount', mint ? normalizeTokenAmount(info.amount, mint.decimals) : info.amount),
 *                 ]}
 *             />
 *         </InstructionCardView>
 *     );
 * }
 * ```
 *
 * Both styles take their chrome from the surface, which is the point; only the
 * factory's brevity is lost.
 */
export function defineInstructionCard<I>(spec: InstructionCardSpec<I>): React.FC<InstructionCardProps<I>> {
    function Card({ node, info }: InstructionCardProps<I>) {
        const title = typeof spec.title === 'function' ? spec.title(info) : spec.title;

        return (
            <InstructionCardView node={node} title={title}>
                <InstructionFields fields={spec.fields(info)} programId={node.programId} />
            </InstructionCardView>
        );
    }

    Card.displayName = `InstructionCard(${typeof spec.title === 'string' ? spec.title : 'dynamic'})`;
    return Card;
}
