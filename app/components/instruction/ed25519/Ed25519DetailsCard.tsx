import { BorshTypesCoder } from '@coral-xyz/anchor/dist/cjs/coder/borsh/types';
import { hash } from '@coral-xyz/anchor/dist/cjs/utils/sha256';
import {
    ParsedTransaction,
    PartiallyDecodedInstruction,
    PublicKey,
    SignatureResult,
    TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import React, { useMemo } from 'react';

import { useAnchorProgram } from '@/app/providers/anchor';
import { useCluster } from '@/app/providers/cluster';
import { mapField, mapIxArgsToRows } from '@/app/utils/anchor';

import { Address } from '../../common/Address';
import { Copyable } from '../../common/Copyable';
import { InstructionCard } from '../InstructionCard';
import { PROGRAM_ID as ED25519_PROGRAM_ID } from './types';
import { Idl, Program } from '@coral-xyz/anchor';

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

function decodeMessageFromAnchorProgram(
    anchorProgram: Program,
    anchorIdl: Idl,
    message: Uint8Array
): { name: string; data: any } | null {
    const coder = anchorProgram.coder.types;

    for (const [_, typeLayouts] of Object.entries(anchorProgram.coder.types)) {
        (typeLayouts as Map<string, any>).forEach((layout, name) => {
            try {
                const disc = Buffer.from(hash(`global:${name}`)).slice(0, 4);
                // .toString('base64');

                if (name === 'swiftOrderParamsMessage') {
                    console.log('message', name, disc);
                    console.log('layout', layout);
                    console.log('reg', layout.registry);
                    console.log('disc', layout.discriminator);

                    // layout.fields.forEach((field: any) => {
                    //     console.log('field', field, 'reg', field.registry);
                    // });
                    // layout.property = '';

                    // const decoded = coder.decode('swiftOrderParamsMessage', Buffer.from(message));
                    const decoded = layout.decode(Buffer.concat([disc, Buffer.from(message)]));
                    console.log('decoded', decoded);
                    if (decoded) {
                        console.log('decoded', name, decoded);
                        return { data: decoded, name: name };
                    }
                }
            } catch (e) {
                console.log('error', e);
            }
        });
    }
    return null;
}

function SignatureDetails({
    index,
    offset,
    signature,
    pubkey,
    message,
    messageIx,
}: {
    index: number;
    offset: Ed25519SignatureOffsets;
    signature: Uint8Array;
    pubkey: Uint8Array;
    message: Uint8Array;
    messageIx: PartiallyDecodedInstruction;
}) {
    const { url } = useCluster();
    const anchorProgram = useAnchorProgram(messageIx.programId.toBase58(), url);

    // const decodedMessage = useMemo(() => {
    //     if (!anchorProgram?.idl || !anchorProgram?.program) {
    //         return null;
    //     }
    //     return decodeMessageFromAnchorProgram(anchorProgram.program, anchorProgram.idl, message);
    // }, [anchorProgram, message]);
    const decodedMessage =
        anchorProgram?.program && anchorProgram?.idl
            ? decodeMessageFromAnchorProgram(anchorProgram.program, anchorProgram.idl, message)
            : null;

    if (decodedMessage) {
        console.log('decodedMessage', decodedMessage);
    }

    const messageRow = useMemo(() => {
        if (!decodedMessage || !anchorProgram?.idl || !anchorProgram?.program) {
            return (
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
            );
        }

        return mapField(
            decodedMessage.name!,
            decodedMessage.data!,
            anchorProgram.idl.types.find(t => t.name === decodedMessage.name),
            anchorProgram.idl
        );
    }, [decodedMessage, message, anchorProgram?.idl]);

    return (
        <React.Fragment>
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
                <td>Message Program</td>
                <td className="text-lg-end">
                    <Address pubkey={messageIx.programId} alignRight link />
                </td>
            </tr>
            {messageRow}
        </React.Fragment>
    );
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
                const signature = extractData(
                    tx,
                    offset.signatureInstructionIndex,
                    ix.data,
                    offset.signatureOffset,
                    64
                );

                const pubkey = extractData(tx, offset.publicKeyInstructionIndex, ix.data, offset.publicKeyOffset, 32);

                const messageIx = tx.message.instructions[
                    offset.messageInstructionIndex
                ] as PartiallyDecodedInstruction;
                const message = bs58
                    .decode(messageIx.data)
                    .slice(offset.messageDataOffset, offset.messageDataOffset + offset.messageDataSize);

                return (
                    <SignatureDetails
                        key={index}
                        index={index}
                        offset={offset}
                        signature={signature}
                        pubkey={pubkey}
                        message={message}
                        messageIx={messageIx}
                    />
                );
            })}
        </InstructionCard>
    );
}
