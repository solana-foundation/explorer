import {
    address,
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    preformatted,
    text,
} from '@entities/instruction-card';
import type { ParsedInstruction, TransactionInstruction } from '@solana/web3.js';
import { wrap } from '@utils/index';
import React from 'react';
import { is } from 'superstruct';

import type { BpfLoaderParsed } from '../lib/bpf-loader-parser';
import { FinalizeInfo, WriteInfo } from '../lib/types';

const TITLE_PREFIX = 'BPF Loader 2';

export const BpfLoaderWriteDetailsCard = defineInstructionCard<WriteInfo>({
    fields: info => [
        address('Account', info.account),
        preformatted('Bytes (Base 64)', wrap(info.bytes, 50)),
        text('Offset', info.offset),
    ],
    title: `${TITLE_PREFIX}: Write`,
});

export const BpfLoaderFinalizeDetailsCard = defineInstructionCard<FinalizeInfo>({
    fields: info => [address('Account', info.account)],
    title: `${TITLE_PREFIX}: Finalize`,
});

type BpfLoaderDetailsCardProps = {
    /** Already normalised by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
    /** Byte form, when the caller has one, so the shell's Raw view can show accounts and data. */
    raw?: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function BpfLoaderDetailsCard({ ix, raw, index, innerCards, childIndex }: BpfLoaderDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix, programId: ix.programId, raw };

    if (!isBpfLoaderParsed(ix.parsed)) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const parsed = ix.parsed;
    switch (parsed.type) {
        case 'write':
            return <BpfLoaderWriteDetailsCard info={parsed.info} node={node} />;
        case 'finalize':
            return <BpfLoaderFinalizeDetailsCard info={parsed.info} node={node} />;
    }
}

/**
 * The dispatcher hands the RPC's own view back when the slice rejects a payload, and that view
 * carries the same type strings — only the slice's schemas tell a decoded envelope from a raw one.
 */
function isBpfLoaderParsed(parsed: unknown): parsed is BpfLoaderParsed {
    if (typeof parsed !== 'object' || parsed === null || !('type' in parsed) || !('info' in parsed)) return false;
    switch (parsed.type) {
        case 'write':
            return is(parsed.info, WriteInfo);
        case 'finalize':
            return is(parsed.info, FinalizeInfo);
        default:
            return false;
    }
}
