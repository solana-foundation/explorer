import type { TransactionInstruction } from '@solana/web3.js';

import type { InstructionNode } from './node';

/** The top-level instructions of a transaction that the page can fetch in raw form. */
export type RawInstructions =
    | { status: 'fetchable'; fetch: () => void }
    | { status: 'failed'; fetch: () => void }
    /** `instructions` is `undefined` when the message cannot be decompiled. */
    | { status: 'fetched'; instructions: readonly TransactionInstruction[] | undefined };

/** What the Raw view of a parsed instruction shows above its JSON. */
export type RawSource =
    | { kind: 'instruction'; ix: TransactionInstruction }
    | { kind: 'fetchable'; fetch: () => void }
    | { kind: 'failed'; fetch: () => void }
    | { kind: 'unavailable' }
    | { kind: 'none' };

export function rawSourceOf(node: InstructionNode, rawInstructions: RawInstructions | undefined): RawSource {
    if (node.raw) return { ix: node.raw, kind: 'instruction' };
    if (!rawInstructions) return { kind: 'none' };
    if (rawInstructions.status === 'fetchable') return { fetch: rawInstructions.fetch, kind: 'fetchable' };
    if (rawInstructions.status === 'failed') return { fetch: rawInstructions.fetch, kind: 'failed' };
    // Inner instructions never carry raw wire data, so only the top-level list has rows to lose.
    if (node.childIndex !== undefined) return { kind: 'none' };
    const ix = rawInstructions.instructions?.[node.index];
    return ix ? { ix, kind: 'instruction' } : { kind: 'unavailable' };
}

export function parsedInstructionOf(node: InstructionNode, rawSource: RawSource): TransactionInstruction | undefined {
    if (!('parsed' in node.ix)) return node.ix;
    return rawSource.kind === 'instruction' ? rawSource.ix : undefined;
}
