import type { TransactionInstruction } from '@solana/web3.js';

import type { InstructionNode } from './node';

/** The instructions of a transaction that the page can fetch in raw form. */
export type RawInstructions =
    | { status: 'fetchable'; fetch: () => void }
    | { status: 'failed'; fetch: () => void }
    | {
          status: 'fetched';
          /** `undefined` when the message cannot be decompiled. */
          instructions: readonly TransactionInstruction[] | undefined;
          /** Keyed by the index of the top-level instruction that invoked them. */
          innerInstructions: ReadonlyMap<number, readonly (TransactionInstruction | undefined)[]> | undefined;
      };

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
    const ix =
        node.childIndex === undefined
            ? rawInstructions.instructions?.[node.index]
            : rawInstructions.innerInstructions?.get(node.index)?.[node.childIndex];
    // The parsed and the raw responses list instructions separately, so their positions can disagree
    return ix?.programId.equals(node.programId) ? { ix, kind: 'instruction' } : { kind: 'unavailable' };
}

export function parsedInstructionOf(node: InstructionNode, rawSource: RawSource): TransactionInstruction | undefined {
    if (!('parsed' in node.ix)) return node.ix;
    return rawSource.kind === 'instruction' ? rawSource.ix : undefined;
}
