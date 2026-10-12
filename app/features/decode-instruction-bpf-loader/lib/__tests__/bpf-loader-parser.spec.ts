import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { AccountRole, type Address, address } from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { Logger } from '@/app/shared/lib/logger';

import { bpfLoaderInstructionParser } from '../bpf-loader-client';
import {
    BPF_LOADER_PARSER_LABEL,
    BPF_LOADER_PROGRAM_ADDRESS,
    parseBpfLoaderKitInstruction,
    parseBpfLoaderRpcInstruction,
} from '../bpf-loader-parser';

const ACCOUNT = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
const RENT = address('SysvarRent111111111111111111111111111111111');

const dispatcher = createInstructionParserDispatcher([bpfLoaderInstructionParser]);

/** Bincode `LoaderInstruction::Write`: u32 variant, u32 offset, then a u64-length-prefixed byte vec. */
function writeData(offset: number, bytes: number[]): Uint8Array {
    const data = new Uint8Array(16 + bytes.length);
    const view = new DataView(data.buffer);
    view.setUint32(0, 0, true);
    view.setUint32(4, offset, true);
    view.setBigUint64(8, BigInt(bytes.length), true);
    data.set(bytes, 16);
    return data;
}

const FINALIZE_DATA = new Uint8Array([1, 0, 0, 0]);

function parse(data: Uint8Array, accounts: Address[]) {
    return parseBpfLoaderKitInstruction({
        accounts: accounts.map(account => ({ address: account, role: AccountRole.WRITABLE_SIGNER })),
        data,
        programAddress: address(BPF_LOADER_PROGRAM_ADDRESS),
    });
}

describe('parseBpfLoaderKitInstruction', () => {
    it('should decode a write onto the RPC field names, with the bytes as base64', () => {
        const parsed = parse(writeData(1024, [2, 0, 0, 0]), [ACCOUNT]);

        expect(parsed?.type).toBe('write');
        expect(parsed?.info).toEqual({ account: new PublicKey(ACCOUNT), bytes: 'AgAAAA==', offset: 1024 });
    });

    it('should decode a finalize from its first account', () => {
        const parsed = parse(FINALIZE_DATA, [ACCOUNT, RENT]);

        expect(parsed).toEqual({ info: { account: new PublicKey(ACCOUNT) }, type: 'finalize' });
    });

    it('should return undefined for a discriminant the loader does not define', () => {
        expect(parse(new Uint8Array([2, 0, 0, 0]), [ACCOUNT])).toBeUndefined();
    });

    // A write whose length prefix runs past the data is truncated, not a shorter write.
    it('should return undefined for a write shorter than its length prefix', () => {
        expect(parse(writeData(0, [1, 2, 3]).slice(0, 17), [ACCOUNT])).toBeUndefined();
    });

    it('should return undefined when the instruction carries no account', () => {
        expect(parse(writeData(0, [1]), [])).toBeUndefined();
    });

    it('should return undefined for a finalize without its rent sysvar', () => {
        expect(parse(FINALIZE_DATA, [ACCOUNT])).toBeUndefined();
    });
});

describe('parseBpfLoaderRpcInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should coerce the account of an RPC write into a key', () => {
        const parsed = parseBpfLoaderRpcInstruction(
            rpcInstruction('write', { account: ACCOUNT, bytes: 'AgAAAA==', offset: 1024 }),
        );

        expect(parsed?.type).toBe('write');
        expect(parsed?.info.account).toEqual(new PublicKey(ACCOUNT));
    });

    it('should return undefined for an instruction type it does not model', () => {
        expect(parseBpfLoaderRpcInstruction(rpcInstruction('initializeBuffer', { account: ACCOUNT }))).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should ignore another program', () => {
        const ix = { ...rpcInstruction('write', {}), program: 'bpf-upgradeable-loader' };

        expect(parseBpfLoaderRpcInstruction(ix)).toBeUndefined();
    });

    // The label already matched, so a payload the schema rejects is RPC drift worth reporting.
    it('should report a payload its schema rejects', () => {
        expect(parseBpfLoaderRpcInstruction(rpcInstruction('write', { account: ACCOUNT }))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});

describe('bpfLoaderInstructionParser', () => {
    it('should decode the byte path through the dispatcher', () => {
        const ix = new TransactionInstruction({
            data: Buffer.from(FINALIZE_DATA),
            keys: [
                { isSigner: true, isWritable: true, pubkey: new PublicKey(ACCOUNT) },
                { isSigner: false, isWritable: false, pubkey: new PublicKey(RENT) },
            ],
            programId: new PublicKey(BPF_LOADER_PROGRAM_ADDRESS),
        });

        const dispatched = dispatcher.fromTransactionInstruction(ix);

        expect(isParsedInstruction(dispatched)).toBe(true);
        expect(dispatched).toMatchObject({ parsed: { type: 'finalize' }, program: BPF_LOADER_PARSER_LABEL });
    });

    it('should report an undecodable byte instruction as unknown to this program', () => {
        const ix = new TransactionInstruction({
            data: Buffer.from([9, 0, 0, 0]),
            keys: [],
            programId: new PublicKey(BPF_LOADER_PROGRAM_ADDRESS),
        });

        expect(dispatcher.fromTransactionInstruction(ix)).toMatchObject({
            programLabel: BPF_LOADER_PARSER_LABEL,
            unknown: true,
        });
    });
});

function rpcInstruction(type: string, info: Record<string, unknown>): ParsedInstruction {
    return {
        parsed: { info, type },
        program: BPF_LOADER_PARSER_LABEL,
        programId: new PublicKey(BPF_LOADER_PROGRAM_ADDRESS),
    };
}
