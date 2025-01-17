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
                const signatureIx = tx.message.instructions[
                    offset.signatureInstructionIndex
                ] as PartiallyDecodedInstruction;
                const signature = signatureIx.data.slice(offset.signatureOffset, offset.signatureOffset + 64);

                const pubkeyIx = tx.message.instructions[
                    offset.publicKeyInstructionIndex
                ] as PartiallyDecodedInstruction;
                const pubkey = bs58.decode(pubkeyIx.data).slice(offset.publicKeyOffset, offset.publicKeyOffset + 32);

                const messageIx = tx.message.instructions[
                    offset.messageInstructionIndex
                ] as PartiallyDecodedInstruction;
                const message = messageIx.data.slice(
                    offset.messageDataOffset,
                    offset.messageDataOffset + offset.messageDataSize
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
                                Instruction {offset.signatureInstructionIndex}, Offset {offset.signatureOffset}
                            </td>
                        </tr>
                        <tr>
                            <td>Signature</td>
                            <td className="text-lg-end font-monospace">
                                <Copyable text={Buffer.from(signature).toString('base64')}>
                                    <span className="font-monospace">{Buffer.from(signature).toString('base64')}</span>
                                </Copyable>
                            </td>
                        </tr>
                        <tr>
                            <td>Public Key Reference</td>
                            <td className="text-lg-end">
                                Instruction {offset.publicKeyInstructionIndex}, Offset {offset.publicKeyOffset}
                            </td>
                        </tr>
                        <tr>
                            <td>Public Key</td>
                            <td className="text-lg-end">
                                <Address pubkey={new PublicKey(pubkey)} alignRight link />
                            </td>
                        </tr>
                        <tr>
                            <td>Message Reference</td>
                            <td className="text-lg-end">
                                Instruction {offset.messageInstructionIndex}, Offset {offset.messageDataOffset}, Size{' '}
                                {offset.messageDataSize}
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
                                <Copyable text={Buffer.from(message).toString('base64')}>
                                    <span className="font-monospace">{Buffer.from(message).toString('base64')}</span>
                                </Copyable>
                            </td>
                        </tr>
                    </React.Fragment>
                );
            })}
        </InstructionCard>
    );
}
