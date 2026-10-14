import {
    address,
    InstructionCardView,
    InstructionFields,
    toInstructionNode,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { type ParsedInstruction, PublicKey, type TransactionInstruction } from '@solana/web3.js';

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
    /** Already decoded by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
    raw?: TransactionInstruction;
};

export function AssociatedTokenDetailsCard({ ix, index, innerCards, childIndex, raw }: Props) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix, raw });
    const parsed = ix.parsed as { info?: Record<string, unknown>; type?: string };
    const variant = VARIANTS[parsed.type as AssociatedTokenParsed['type']];
    const info = parsed.info;

    // Every field this variant renders must already be a coerced PublicKey. If any
    // is not, `ix` is RPC's raw fallback rather than this slice's output. Only the
    // tx page can reach this: the inspector's `fromTransactionInstruction` reports
    // failures as `{ unknown: true }`, which its section handles before this card.
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
