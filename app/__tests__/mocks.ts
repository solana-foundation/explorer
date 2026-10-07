import {
    Message,
    MessageArgs,
    MessageV0,
    MessageV0Args,
    PublicKey,
    TransactionMessage,
    VersionedMessage,
} from '@solana/web3.js';
import { expect } from 'vitest';

import { resolveAddressLookupTables } from './mock-resolvers';

/** Lookup tables resolve from stored copies, so decompiling a stub needs no network. */
export function decompileStubInstruction(stub: string, index: number, { programId }: { programId: string }) {
    const message = 'staticAccountKeys' in JSON.parse(stub) ? deserializeMessageV0(stub) : deserializeMessage(stub);
    const instruction = TransactionMessage.decompile(message, {
        addressLookupTableAccounts: resolveAddressLookupTables(message.addressTableLookups),
    }).instructions[index];
    expect(instruction.programId.toBase58()).toBe(programId);
    return { instruction, message };
}

export function deserializeMessage(message: string): VersionedMessage {
    const m = JSON.parse(message) as MessageArgs;
    const vm = new Message(m);

    return vm;
}

export function deserializeMessageV0(message: string): VersionedMessage {
    const m = JSON.parse(message);
    const messageArgs: MessageV0Args = {
        addressTableLookups:
            m.addressTableLookups?.map(
                (atl: { accountKey: string; writableIndexes: number[]; readonlyIndexes: number[] }) => {
                    return {
                        accountKey: new PublicKey(atl.accountKey),
                        readonlyIndexes: atl.readonlyIndexes,
                        writableIndexes: atl.writableIndexes,
                    };
                },
            ) ?? [],
        compiledInstructions: m.compiledInstructions.map(
            (ci: {
                programIdIndex: number;
                accountKeyIndexes: number[];
                data: { [key: string]: number } | { type: 'Buffer'; data: number[] };
            }) => {
                let data: Uint8Array;
                if ('type' in ci.data) {
                    data = Uint8Array.from(ci.data.data as number[]);
                } else {
                    data = new Uint8Array([...Object.values(ci.data)]);
                }

                return {
                    accountKeyIndexes: ci.accountKeyIndexes,
                    data: data,
                    programIdIndex: ci.programIdIndex,
                };
            },
        ),
        header: m.header,
        recentBlockhash: m.recentBlockhash,
        staticAccountKeys: m.staticAccountKeys.map((sak: string) => new PublicKey(sak)),
    };
    const vm = new MessageV0(messageArgs);

    return vm;
}
