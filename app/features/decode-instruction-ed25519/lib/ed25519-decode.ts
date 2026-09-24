import { type Address, getAddressDecoder, type ReadonlyUint8Array } from '@solana/kit';

import { readUint8, readUint16LE } from '@/app/shared/lib/bytes';

const ADDRESS_DECODER = getAddressDecoder();

/** The program's stand-in for "the bytes are in this instruction". */
const SELF_REFERENCE_INSTRUCTION_INDEX = 65535;

/** One Ed25519SignatureOffsets struct. */
const OFFSETS_SIZE = 14;

const SIGNATURE_SIZE = 64;
const PUBLIC_KEY_SIZE = 32;

export type Ed25519SignatureOffsets = {
    signatureOffset: number;
    signatureInstructionIndex: number;
    publicKeyOffset: number;
    publicKeyInstructionIndex: number;
    messageDataOffset: number;
    messageDataSize: number;
    messageInstructionIndex: number;
};

/** Where a field's bytes live. `instructionIndex` is absent when they are in the ed25519 instruction itself. */
type Ed25519Reference = {
    instructionIndex?: number;
    offset: number;
};

export type Ed25519SignatureDetails = {
    signature: Ed25519Reference & { bytes?: Uint8Array };
    /**
     * Resolved here rather than in the card: a reference may land on fewer than 32
     * bytes, which is not a key, and building one from those would throw mid-render.
     */
    publicKey: Ed25519Reference & { address?: Address };
    message: Ed25519Reference & { size: number; bytes?: Uint8Array };
};

/**
 * Wire data of the transaction's instruction at `index`, or `undefined` when there is no such
 * instruction or its bytes are unavailable (an RPC-parsed neighbour carries no wire data).
 */
export type SiblingInstructionData = (index: number) => ReadonlyUint8Array | undefined;

// See https://docs.anza.xyz/runtime/programs/#ed25519-program
export function decodeEd25519Offsets(data: Uint8Array): Ed25519SignatureOffsets[] {
    const count = readUint8(data, 0);
    const offsets: Ed25519SignatureOffsets[] = [];

    // Skip the count and the padding byte after it.
    let cursor = 2;

    // The count is attacker-controlled, so stop at whatever the data actually holds.
    for (let i = 0; i < count && cursor + OFFSETS_SIZE <= data.length; i++) {
        offsets.push({
            messageDataOffset: readUint16LE(data, cursor + 8),
            messageDataSize: readUint16LE(data, cursor + 10),
            messageInstructionIndex: readUint16LE(data, cursor + 12),
            publicKeyInstructionIndex: readUint16LE(data, cursor + 6),
            publicKeyOffset: readUint16LE(data, cursor + 4),
            signatureInstructionIndex: readUint16LE(data, cursor + 2),
            signatureOffset: readUint16LE(data, cursor),
        });
        cursor += OFFSETS_SIZE;
    }

    return offsets;
}

/**
 * Follows every offset to the bytes it names. Each one points either into this
 * instruction's data or into another instruction's, which is why a lookup over the
 * whole transaction is needed to read a single ed25519 instruction.
 */
export function resolveEd25519Signatures(
    offsets: readonly Ed25519SignatureOffsets[],
    data: Uint8Array,
    siblingData: SiblingInstructionData,
): Ed25519SignatureDetails[] {
    const read = (instructionIndex: number, offset: number, length: number) =>
        readReferencedBytes(data, siblingData, instructionIndex, offset, length);

    return offsets.map(entry => ({
        message: {
            bytes: read(entry.messageInstructionIndex, entry.messageDataOffset, entry.messageDataSize),
            instructionIndex: referencedInstruction(entry.messageInstructionIndex),
            offset: entry.messageDataOffset,
            size: entry.messageDataSize,
        },
        publicKey: {
            address: toAddress(read(entry.publicKeyInstructionIndex, entry.publicKeyOffset, PUBLIC_KEY_SIZE)),
            instructionIndex: referencedInstruction(entry.publicKeyInstructionIndex),
            offset: entry.publicKeyOffset,
        },
        signature: {
            bytes: read(entry.signatureInstructionIndex, entry.signatureOffset, SIGNATURE_SIZE),
            instructionIndex: referencedInstruction(entry.signatureInstructionIndex),
            offset: entry.signatureOffset,
        },
    }));
}

function referencedInstruction(instructionIndex: number): number | undefined {
    return instructionIndex === SELF_REFERENCE_INSTRUCTION_INDEX ? undefined : instructionIndex;
}

function readReferencedBytes(
    own: Uint8Array,
    siblingData: SiblingInstructionData,
    instructionIndex: number,
    offset: number,
    length: number,
): Uint8Array | undefined {
    const source = instructionIndex === SELF_REFERENCE_INSTRUCTION_INDEX ? own : siblingData(instructionIndex);
    return source?.slice(offset, offset + length);
}

function toAddress(bytes: Uint8Array | undefined): Address | undefined {
    if (bytes?.length !== PUBLIC_KEY_SIZE) {
        return undefined;
    }
    return ADDRESS_DECODER.decode(bytes);
}
