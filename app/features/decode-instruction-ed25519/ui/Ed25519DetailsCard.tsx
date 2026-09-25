import {
    address,
    custom,
    defineInstructionCard,
    heading,
    InstructionCardView,
    type InstructionFieldList,
    type InstructionNode,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Copyable } from '@/app/components/common/Copyable';
import { toBase64 } from '@/app/shared/lib/bytes';

import {
    type Ed25519SignatureDetails,
    resolveEd25519Signatures,
    type SiblingInstructionData,
} from '../lib/ed25519-decode';
import type { Ed25519Parsed } from '../lib/ed25519-parser';

const INVALID_REFERENCE = 'Invalid reference';

const Ed25519VerifyCard = defineInstructionCard<Ed25519SignatureDetails[]>({
    fields: signatures => signatures.flatMap(signatureFields),
    title: 'Ed25519: Verify Signature',
});

type Ed25519DetailsCardProps = {
    /** The dispatcher's verdict for an ed25519 instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's hex view and for offsets that point into this instruction. */
    raw: TransactionInstruction;
    /** Offsets may point into other instructions, which only the caller can see. */
    siblingData: SiblingInstructionData;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function Ed25519DetailsCard({ ix, raw, siblingData, index, innerCards, childIndex }: Ed25519DetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };

    if ('unknown' in ix) {
        return <InstructionCardView node={node} title="Ed25519: Unknown Instruction" defaultRaw />;
    }

    const parsed = ix.parsed as Ed25519Parsed;
    const signatures = resolveEd25519Signatures(parsed.info.signatures, raw.data, siblingData);

    return <Ed25519VerifyCard node={node} info={signatures} />;
}

/** One instruction verifies any number of signatures, so each gets its own group of rows. */
function signatureFields(
    { signature, publicKey, message }: Ed25519SignatureDetails,
    index: number,
): InstructionFieldList {
    return [
        heading(`Signature #${index + 1}`),
        text('Signature Reference', referenceText(signature)),
        signature.bytes
            ? custom('Signature', <Base64Value value={toBase64(signature.bytes)} />)
            : text('Signature', INVALID_REFERENCE),
        text('Public Key Reference', referenceText(publicKey)),
        publicKey.address ? address('Public Key', publicKey.address) : text('Public Key', INVALID_REFERENCE),
        text('Message Reference', `${referenceText(message)}, Size ${message.size}`),
        message.bytes
            ? custom('Message', <Base64Value value={toBase64(message.bytes)} wrapped />)
            : text('Message', INVALID_REFERENCE),
    ];
}

function referenceText({ instructionIndex, offset }: { instructionIndex?: number; offset: number }): string {
    const source = instructionIndex === undefined ? 'This instruction' : `Instruction ${instructionIndex}`;
    return `${source}, Offset ${offset}`;
}

/**
 * `wrapped` is for the message, the only field long enough that breaking it beats scrolling. It has
 * to be a block: on an inline span the tighter line-height is inert, because the cell's own
 * line-height still sets each line box.
 */
function Base64Value({ value, wrapped }: { value: string; wrapped?: boolean }) {
    const copyable = (
        <Copyable text={value}>
            <span className="font-mono">{value}</span>
        </Copyable>
    );
    if (!wrapped) return copyable;
    return <span className="block whitespace-normal break-all text-[0.85rem] leading-[1.2]">{copyable}</span>;
}
