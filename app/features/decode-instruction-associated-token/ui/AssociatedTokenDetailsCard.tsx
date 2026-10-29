import {
    address,
    InstructionCardView,
    InstructionFields,
    type InstructionNode,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { PublicKey } from '@solana/web3.js';

import type { AssociatedTokenParsed } from '../lib/associated-token-parser';
import type { CreateAccountsInfo, RecoverNestedInfo } from '../lib/types';

/**
 * `create` and `createIdempotent` share an account layout, so they share a field
 * list. The order here is the render order.
 */
const CREATE_FIELDS = [
    ['Source', 'source'],
    ['Account', 'account'],
    ['Mint', 'mint'],
    ['Wallet', 'wallet'],
    ['System Program', 'systemProgram'],
    ['Token Program', 'tokenProgram'],
] as const satisfies ReadonlyArray<readonly [string, keyof CreateAccountsInfo]>;

const RECOVER_NESTED_FIELDS = [
    ['Destination', 'destination'],
    ['Nested Mint', 'nestedMint'],
    ['Nested Owner', 'nestedOwner'],
    ['Nested Source', 'nestedSource'],
    ['Owner Mint', 'ownerMint'],
    ['Owner', 'wallet'],
    ['Token Program', 'tokenProgram'],
] as const satisfies ReadonlyArray<readonly [string, keyof RecoverNestedInfo]>;

const VARIANTS = {
    create: { fields: CREATE_FIELDS, title: 'Associated Token Program: Create' },
    createIdempotent: { fields: CREATE_FIELDS, title: 'Associated Token Program: Create Idempotent' },
    recoverNested: { fields: RECOVER_NESTED_FIELDS, title: 'Associated Token Program: Recover Nested' },
} satisfies Record<AssociatedTokenParsed['type'], { fields: ReadonlyArray<readonly [string, string]>; title: string }>;

type Props = {
    node: InstructionNode;
    /** Already decoded by the dispatcher — this card does not decode. */
    parsed: unknown;
};

export function AssociatedTokenDetailsCard({ node, parsed }: Props) {
    const { info, type } = parsed as { info?: Record<string, unknown>; type?: string };
    const variant = VARIANTS[type as AssociatedTokenParsed['type']];

    // Every field this variant renders must already be a coerced PublicKey. If any
    // is not, `parsed` is RPC's raw fallback rather than this slice's output. Only the
    // tx page can reach this: `fromTransactionInstruction` reports
    // failures as `{ unknown: true }`, which the router handles before this card.
    const isCanonical = Boolean(variant && info && variant.fields.every(([, f]) => info[f] instanceof PublicKey));

    if (!variant || !info || !isCanonical) {
        return <UnknownDetailsCard node={node} />;
    }

    return (
        <InstructionCardView node={node} title={variant.title}>
            <InstructionFields
                programId={node.programId}
                fields={variant.fields.map(([label, field]) => address(label, info[field] as PublicKey))}
            />
        </InstructionCardView>
    );
}
