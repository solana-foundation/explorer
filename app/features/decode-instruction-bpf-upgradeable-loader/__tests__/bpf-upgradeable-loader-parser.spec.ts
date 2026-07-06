import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, test } from 'vitest';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import {
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    parseBpfUpgradeableLoaderInstruction,
    parseBpfUpgradeableLoaderRpcInstruction,
} from '../lib/bpf-upgradeable-loader-parser';

const PROGRAM_ID = new PublicKey(BPF_UPGRADEABLE_LOADER_PROGRAM_ID);
const account = new PublicKey('GcdayuLaLyrdmUu324nahyv33G5poQdLUEZ1nEytDeP');
const authority = new PublicKey('5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9');
const newAuthority = new PublicKey('Addo6uyKf6oRpiCfdj1HEN3PwQuJM7QyhBPCNqRPpwUC');

function key(pubkey: PublicKey) {
    return { isSigner: false, isWritable: true, pubkey };
}

function u32le(value: number): Buffer {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(value, 0);
    return b;
}

function decodeRaw(data: Buffer, keys: PublicKey[]) {
    const ix = new TransactionInstruction({ data, keys: keys.map(key), programId: PROGRAM_ID });
    return parseBpfUpgradeableLoaderInstruction(toKitInstruction(ix));
}

describe('parseBpfUpgradeableLoaderInstruction (byte path)', () => {
    test('should decode SetAuthorityChecked (discriminant 7) with all three accounts', () => {
        const parsed = decodeRaw(u32le(7), [account, authority, newAuthority]);
        expect(parsed?.type).toBe('setAuthorityChecked');
        expect((parsed?.info as any).account.equals(account)).toBe(true);
        expect((parsed?.info as any).authority.equals(authority)).toBe(true);
        expect((parsed?.info as any).newAuthority.equals(newAuthority)).toBe(true);
    });

    test('should decode SetAuthority (discriminant 4) with optional newAuthority present and absent', () => {
        const withNew = decodeRaw(u32le(4), [account, authority, newAuthority]);
        expect(withNew?.type).toBe('setAuthority');
        expect((withNew?.info as any).newAuthority.equals(newAuthority)).toBe(true);

        const withoutNew = decodeRaw(u32le(4), [account, authority]);
        expect(withoutNew?.type).toBe('setAuthority');
        expect((withoutNew?.info as any).newAuthority).toBeUndefined();
    });

    test('should decode Write (discriminant 1) offset and base64 bytes', () => {
        const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
        const len = Buffer.alloc(8);
        len.writeBigUInt64LE(BigInt(payload.length), 0);
        const data = Buffer.concat([u32le(1), u32le(42), len, payload]);

        const parsed = decodeRaw(data, [account, authority]);
        expect(parsed?.type).toBe('write');
        expect((parsed?.info as any).offset).toBe(42);
        expect((parsed?.info as any).bytes).toBe(payload.toString('base64'));
    });

    test('should decode ExtendProgram (discriminant 6) additionalBytes', () => {
        // data = discriminant(6) + additionalBytes(u32); accounts = [programData, program]
        const data = Buffer.concat([u32le(6), u32le(1024)]);
        const parsed = decodeRaw(data, [account, authority]);
        expect(parsed?.type).toBe('extendProgram');
        expect((parsed?.info as any).additionalBytes).toBe(1024);
        expect((parsed?.info as any).programDataAccount.equals(account)).toBe(true);
        expect((parsed?.info as any).programAccount.equals(authority)).toBe(true);
        expect((parsed?.info as any).payerAccount).toBeNull();
    });

    test('should return undefined for data shorter than the 4-byte discriminant', () => {
        expect(decodeRaw(Buffer.from([1, 2]), [account])).toBeUndefined();
    });
});

describe('byte-parsed vs RPC-parsed parity (SetAuthorityChecked)', () => {
    test('should produce equal account pubkeys on both paths', () => {
        const byteParsed = decodeRaw(u32le(7), [account, authority, newAuthority]);

        const rpcParsed = parseBpfUpgradeableLoaderRpcInstruction({
            parsed: {
                info: {
                    account: account.toBase58(),
                    authority: authority.toBase58(),
                    newAuthority: newAuthority.toBase58(),
                },
                type: 'setAuthorityChecked',
            },
            program: 'bpf-upgradeable-loader',
            programId: PROGRAM_ID,
        });

        expect(byteParsed?.type).toBe(rpcParsed?.type);
        expect((byteParsed?.info as any).account.equals((rpcParsed?.info as any).account)).toBe(true);
        expect((byteParsed?.info as any).authority.equals((rpcParsed?.info as any).authority)).toBe(true);
        expect((byteParsed?.info as any).newAuthority.equals((rpcParsed?.info as any).newAuthority)).toBe(true);
    });
});
