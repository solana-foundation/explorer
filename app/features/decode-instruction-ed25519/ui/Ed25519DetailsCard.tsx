import {
    address,
    defineInstructionCard,
    heading,
    InstructionCardView,
    type InstructionFieldList,
    type RawInstructionNode,
    string,
    text,
} from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';

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
    /** Offsets that reference this instruction point into the data of `raw`. */
    node: RawInstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
    /** Offsets may point into other instructions, which only the caller can see. */
    siblingData: SiblingInstructionData;
};

export function Ed25519DetailsCard({ node, parsed, siblingData }: Ed25519DetailsCardProps) {
    if (!parsed) {
        return <InstructionCardView node={node} title="Ed25519: Unknown Instruction" />;
    }

    const parsedInfo = parsed as Ed25519Parsed;
    const signatures = resolveEd25519Signatures(parsedInfo.info.signatures, node.raw.data, siblingData);

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
        signature.bytes ? string('Signature', toBase64(signature.bytes)) : text('Signature', INVALID_REFERENCE),
        text('Public Key Reference', referenceText(publicKey)),
        publicKey.address ? address('Public Key', publicKey.address) : text('Public Key', INVALID_REFERENCE),
        text('Message Reference', `${referenceText(message)}, Size ${message.size}`),
        message.bytes ? string('Message', toBase64(message.bytes)) : text('Message', INVALID_REFERENCE),
    ];
}

function referenceText({ instructionIndex, offset }: { instructionIndex?: number; offset: number }): string {
    const source = instructionIndex === undefined ? 'This instruction' : `Instruction ${instructionIndex}`;
    return `${source}, Offset ${offset}`;
}
