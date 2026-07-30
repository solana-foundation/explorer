import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import { ProgramField } from '@entities/instruction-card';
import { type ParsedInstruction, PublicKey, type SignatureResult, type TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

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

/**
 * Renders one account address. The transaction page links out to the account;
 * the inspector substitutes `AddressWithContext` to show in-transaction context.
 */
export type AddressCell = React.ComponentType<{ pubkey: PublicKey }>;

const LinkedAddress: AddressCell = ({ pubkey }) => <Address pubkey={pubkey} alignRight link />;

/** Props the injected card shell must accept. Satisfied by both shells. */
type CardShellProps = React.PropsWithChildren<{
    childIndex?: number;
    index: number;
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    raw?: TransactionInstruction;
    result: SignatureResult;
    title: string;
}>;

type Props = {
    /** Already decoded by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    raw?: TransactionInstruction;
    AddressComponent?: AddressCell;
    InstructionCardComponent?: React.ComponentType<CardShellProps>;
    /** The transaction page shows the program row; the inspector lists accounts itself. */
    showProgramField?: boolean;
};

/**
 * Presentational card for an Associated Token instruction. `ix` normally arrives
 * already decoded into the slice's canonical `AssociatedTokenParsed` shape, so
 * this component only maps named fields onto labelled rows — it never re-decodes
 * and never indexes accounts positionally.
 *
 * It cannot blindly trust that shape, though: when this slice's parser rejects a
 * payload, `createInstructionParserDispatcher` falls back to RPC's raw view, which
 * still carries a familiar `type` but holds un-coerced base58 strings instead of
 * `PublicKey`s. So the shape is checked, and anything unrecognised degrades to the
 * unknown-instruction card rather than throwing mid-render.
 */
export function AssociatedTokenDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    raw,
    AddressComponent = LinkedAddress,
    InstructionCardComponent = InstructionCard,
    showProgramField = true,
}: Props) {
    const parsed = ix.parsed as { info?: Record<string, unknown>; type?: string };
    const variant = VARIANTS[parsed.type as AssociatedTokenParsed['type']];
    const info = parsed.info;

    // Every field this variant renders must already be a coerced PublicKey. If any
    // is not, `ix` is RPC's raw fallback rather than this slice's output. Only the
    // tx page can reach this: the inspector's `fromTransactionInstruction` reports
    // failures as `{ unknown: true }`, which its section handles before this card.
    const isCanonical = Boolean(variant && info && variant.fields.every(([, f]) => info[f] instanceof PublicKey));

    if (!variant || !info || !isCanonical) {
        return (
            <UnknownDetailsCard
                ix={ix}
                index={index}
                result={result}
                innerCards={innerCards}
                childIndex={childIndex}
                // Both real shells accept these props; the declared types differ only
                // in `innerCards` (ReactNode[] vs JSX.Element[]), which this call does
                // not rely on.
                InstructionCardComponent={InstructionCardComponent as React.FC<Parameters<typeof InstructionCard>[0]>}
            />
        );
    }

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title={variant.title}
            innerCards={innerCards}
            childIndex={childIndex}
            raw={raw}
        >
            {showProgramField && <ProgramField programId={ix.programId} />}
            {variant.fields.map(([label, field]) => (
                <BaseTable.Row key={field}>
                    <BaseTable.Cell>{label}</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <AddressComponent pubkey={info[field] as PublicKey} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
        </InstructionCardComponent>
    );
}
