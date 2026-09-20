import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { AccountRole, type Address, address } from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getCloseLookupTableInstructionDataEncoder,
    getCreateLookupTableInstructionDataEncoder,
    getDeactivateLookupTableInstructionDataEncoder,
    getExtendLookupTableInstructionDataEncoder,
    getFreezeLookupTableInstructionDataEncoder,
} from '@solana-program/address-lookup-table';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { Logger } from '@/app/shared/lib/logger';

import { addressLookupTableInstructionParser } from '../address-lookup-table-client';
import {
    ADDRESS_LOOKUP_TABLE_PARSER_LABEL,
    ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS,
    parseAddressLookupTableKitInstruction,
    parseAddressLookupTableRpcInstruction,
} from '../address-lookup-table-parser';

const TABLE = address('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2');
const AUTHORITY = address('3EbFtRfKRMTrhPrRQjxbfWCB6NUyTQxwsWTKQFVKgNbb');
const PAYER = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
const RECIPIENT = address('4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp');
const ENTRY = address('5rATVSqZjaHzMqSJmnbEQNmSJhaKMwsA7Zx2KfBWZBS4');
const SYSTEM = address('11111111111111111111111111111111');

const dispatcher = createInstructionParserDispatcher([addressLookupTableInstructionParser]);

function parse(data: Uint8Array, accounts: Address[]) {
    return parseAddressLookupTableKitInstruction({
        accounts: accounts.map(account => ({ address: account, role: AccountRole.WRITABLE })),
        data,
        programAddress: ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS,
    });
}

const base58 = (keys: Record<string, unknown>) =>
    Object.fromEntries(
        Object.entries(keys).map(([name, value]) => [
            name,
            value instanceof PublicKey ? value.toBase58() : Array.isArray(value) ? value.map(String) : value,
        ]),
    );

describe('parseAddressLookupTableKitInstruction', () => {
    it('should map Create Lookup Table accounts and data onto the RPC field names', () => {
        const data = getCreateLookupTableInstructionDataEncoder().encode({ bump: 255, recentSlot: 123_456_789n });
        const parsed = parse(new Uint8Array(data), [TABLE, AUTHORITY, PAYER, SYSTEM]);

        expect(parsed?.type).toBe('createLookupTable');
        expect(base58(parsed?.info ?? {})).toEqual({
            bumpSeed: 255,
            lookupTableAccount: TABLE,
            lookupTableAuthority: AUTHORITY,
            payerAccount: PAYER,
            recentSlot: 123_456_789,
            systemProgram: SYSTEM,
        });
    });

    it('should carry the extended addresses as keys', () => {
        const data = getExtendLookupTableInstructionDataEncoder().encode({ addresses: [ENTRY, ENTRY] });
        const parsed = parse(new Uint8Array(data), [TABLE, AUTHORITY, PAYER, SYSTEM]);

        expect(parsed?.type).toBe('extendLookupTable');
        expect(base58(parsed?.info ?? {})).toEqual({
            lookupTableAccount: TABLE,
            lookupTableAuthority: AUTHORITY,
            newAddresses: [ENTRY, ENTRY],
        });
    });

    it.each([
        ['freezeLookupTable', getFreezeLookupTableInstructionDataEncoder()],
        ['deactivateLookupTable', getDeactivateLookupTableInstructionDataEncoder()],
    ] as const)('should decode %s from its two accounts', (type, encoder) => {
        const parsed = parse(new Uint8Array(encoder.encode({})), [TABLE, AUTHORITY]);

        expect(parsed?.type).toBe(type);
        expect(base58(parsed?.info ?? {})).toEqual({ lookupTableAccount: TABLE, lookupTableAuthority: AUTHORITY });
    });

    it('should decode Close Lookup Table with its recipient', () => {
        const data = getCloseLookupTableInstructionDataEncoder().encode({});
        const parsed = parse(new Uint8Array(data), [TABLE, AUTHORITY, RECIPIENT]);

        expect(parsed?.type).toBe('closeLookupTable');
        expect(base58(parsed?.info ?? {})).toEqual({
            lookupTableAccount: TABLE,
            lookupTableAuthority: AUTHORITY,
            recipient: RECIPIENT,
        });
    });

    it('should reject an unknown discriminator rather than throw', () => {
        expect(parse(new Uint8Array([9, 0, 0, 0]), [TABLE, AUTHORITY])).toBeUndefined();
    });

    it('should reject an instruction short an account rather than throw', () => {
        const data = getCloseLookupTableInstructionDataEncoder().encode({});
        expect(parse(new Uint8Array(data), [TABLE, AUTHORITY])).toBeUndefined();
    });
});

describe('parseAddressLookupTableRpcInstruction', () => {
    it('should validate each type against its own schema', () => {
        const parsed = parseAddressLookupTableRpcInstruction(
            rpc('extendLookupTable', {
                lookupTableAccount: TABLE,
                lookupTableAuthority: AUTHORITY,
                newAddresses: [ENTRY],
            }),
        );

        expect(parsed?.type).toBe('extendLookupTable');
        expect(base58(parsed?.info ?? {})).toEqual({
            lookupTableAccount: TABLE,
            lookupTableAuthority: AUTHORITY,
            newAddresses: [ENTRY],
        });
    });

    it('should reject an unrecognized type silently', () => {
        expect(parseAddressLookupTableRpcInstruction(rpc('resizeLookupTable', {}))).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should reject and report a payload missing a required field', () => {
        const parsed = parseAddressLookupTableRpcInstruction(
            rpc('closeLookupTable', { lookupTableAccount: TABLE, lookupTableAuthority: AUTHORITY }),
        );

        expect(parsed).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});

describe('addressLookupTableInstructionParser', () => {
    it('should produce the same envelope from bytes and from the RPC view', () => {
        const data = getFreezeLookupTableInstructionDataEncoder().encode({});
        const fromBytes = dispatcher.fromTransactionInstruction(
            new TransactionInstruction({
                data: Buffer.from(data),
                keys: [TABLE, AUTHORITY].map(key => ({
                    isSigner: false,
                    isWritable: true,
                    pubkey: new PublicKey(key),
                })),
                programId: new PublicKey(ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS),
            }),
        );
        const fromRpc = dispatcher.fromParsedInstruction(
            rpc('freezeLookupTable', { lookupTableAccount: TABLE, lookupTableAuthority: AUTHORITY }),
        );

        expect(isParsedInstruction(fromBytes)).toBe(true);
        expect(fromBytes).toEqual(fromRpc);
    });
});

function rpc(type: string, info: unknown): ParsedInstruction {
    return {
        parsed: { info, type },
        program: ADDRESS_LOOKUP_TABLE_PARSER_LABEL,
        programId: new PublicKey(ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS),
    };
}
