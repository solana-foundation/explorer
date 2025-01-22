import {
    ParsedTransaction,
    PartiallyDecodedInstruction,
    PublicKey,
    SignatureResult,
    TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import React from 'react';

import { Address } from '../../common/Address';
import { Copyable } from '../../common/Copyable';
import { InstructionCard } from '../InstructionCard';
import { PROGRAM_ID as ED25519_PROGRAM_ID } from './types';

const ED25519_SELF_REFERENCE_INSTRUCTION_INDEX = 65535;

type DetailsProps = {
    tx: ParsedTransaction;
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

interface Ed25519SignatureOffsets {
    signatureOffset: number; // offset to ed25519 signature of 64 bytes
    signatureInstructionIndex: number; // instruction index to find signature
    publicKeyOffset: number; // offset to public key of 32 bytes
    publicKeyInstructionIndex: number; // instruction index to find public key
    messageDataOffset: number; // offset to start of message data
    messageDataSize: number; // size of message data
    messageInstructionIndex: number; // index of instruction data to get message data
}

// See https://docs.anza.xyz/runtime/programs/#ed25519-program
function decodeEd25519Instruction(data: Buffer): Ed25519SignatureOffsets[] {
    const count = data.readUInt8(0);
    const offsets: Ed25519SignatureOffsets[] = [];

    let cursor = 2; // Skip count and padding byte

    for (let i = 0; i < count; i++) {
        const offset: Ed25519SignatureOffsets = {
            messageDataOffset: data.readUInt16LE(cursor + 8),
            messageDataSize: data.readUInt16LE(cursor + 10),
            messageInstructionIndex: data.readUInt16LE(cursor + 12),
            publicKeyInstructionIndex: data.readUInt16LE(cursor + 6),
            publicKeyOffset: data.readUInt16LE(cursor + 4),
            signatureInstructionIndex: data.readUInt16LE(cursor + 2),
            signatureOffset: data.readUInt16LE(cursor),
        };
        offsets.push(offset);
        cursor += 14; // Number of bytes in one Ed25519SignatureOffsets struct
    }

    return offsets;
}

const extractData = (
    tx: ParsedTransaction,
    instructionIndex: number,
    sourceData: Buffer,
    dataOffset: number,
    dataLength: number
): Uint8Array | null => {
    if (instructionIndex === ED25519_SELF_REFERENCE_INSTRUCTION_INDEX) {
        return sourceData.slice(dataOffset, dataOffset + dataLength);
    }

    const targetIx = tx.message.instructions[instructionIndex] as PartiallyDecodedInstruction;
    try {
        return bs58.decode(targetIx.data).slice(dataOffset, dataOffset + dataLength);
    } catch (err) {
        return null;
    }
};

export function Ed25519DetailsCard(props: DetailsProps) {
    const { tx, ix, index, result, innerCards, childIndex } = props;

    const offsets = decodeEd25519Instruction(ix.data);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Ed25519: Verify Signature"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ED25519_PROGRAM_ID} alignRight link />
                </td>
            </tr>

            {offsets.map((offset, index) => {
                const signature = extractData(
                    tx,
                    offset.signatureInstructionIndex,
                    ix.data,
                    offset.signatureOffset,
                    64
                );

                const pubkey = extractData(tx, offset.publicKeyInstructionIndex, ix.data, offset.publicKeyOffset, 32);

                const message = extractData(
                    tx,
                    offset.messageInstructionIndex,
                    ix.data,
                    offset.messageDataOffset,
                    offset.messageDataSize
                );

                return (
                    <React.Fragment key={index}>
                        <tr className="table-sep">
                            <td colSpan={2} className="text-lg-start" align="left">
                                Signature #{index + 1}
                            </td>
                        </tr>
                        <tr>
                            <td>Signature Reference</td>
                            <td className="text-lg-end">
                                {offset.signatureInstructionIndex === ED25519_SELF_REFERENCE_INSTRUCTION_INDEX
                                    ? 'This instruction'
                                    : `Instruction ${offset.signatureInstructionIndex}`}
                                {', '}
                                Offset {offset.signatureOffset}
                            </td>
                        </tr>
                        <tr>
                            <td>Signature</td>
                            <td className="text-lg-end">
                                {signature ? (
                                    <Copyable text={Buffer.from(signature).toString('base64')}>
                                        <span className="font-monospace">
                                            {Buffer.from(signature).toString('base64')}
                                        </span>
                                    </Copyable>
                                ) : (
                                    'Invalid reference'
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>Public Key Reference</td>
                            <td className="text-lg-end">
                                {offset.publicKeyInstructionIndex === ED25519_SELF_REFERENCE_INSTRUCTION_INDEX
                                    ? 'This instruction'
                                    : `Instruction ${offset.publicKeyInstructionIndex}`}
                                {', '}
                                Offset {offset.publicKeyOffset}
                            </td>
                        </tr>
                        <tr>
                            <td>Public Key</td>
                            <td className="text-lg-end">
                                {pubkey ? (
                                    <Address pubkey={new PublicKey(pubkey)} alignRight link />
                                ) : (
                                    'Invalid reference'
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>Message Reference</td>
                            <td className="text-lg-end">
                                {offset.messageInstructionIndex === ED25519_SELF_REFERENCE_INSTRUCTION_INDEX
                                    ? 'This instruction'
                                    : `Instruction ${offset.messageInstructionIndex}`}
                                {', '}
                                Offset {offset.messageDataOffset}, Size {offset.messageDataSize}
                            </td>
                        </tr>
                        <tr>
                            <td>Message</td>
                            <td
                                className="text-lg-end"
                                style={{
                                    fontSize: '0.85rem',
                                    lineHeight: '1.2',
                                    maxWidth: '100%',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {message ? (
                                    <Copyable text={Buffer.from(message).toString('base64')}>
                                        <span className="font-monospace">
                                            {Buffer.from(message).toString('base64')}
                                        </span>
                                    </Copyable>
                                ) : (
                                    'Invalid reference'
                                )}
                            </td>
                        </tr>
                    </React.Fragment>
                );
            })}
        </InstructionCard>
    );
}
