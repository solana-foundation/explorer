import type { AccountInfo, Connection, VersionedMessage } from '@solana/web3.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import {
    ALT_2_ADDRS,
    ALT_2_EXPECTED_ADDRESSES,
    ALT_3_ADDRS,
    ALT_3_EXPECTED_ADDRESSES,
} from '@/app/fixtures/address-lookup-tables';
import { fromBase64 } from '@/app/shared/lib/bytes';

import { resolveAddressLookupTables } from '../resolve-address-lookup-tables';

const ALT_KEY_1 = Keypair.generate().publicKey;
const ALT_KEY_2 = Keypair.generate().publicKey;

describe('resolveAddressLookupTables', () => {
    it('should return empty array when message has no lookups', async () => {
        const connection = mockConnection([]);
        const result = await resolveAddressLookupTables(connection, message([]));

        expect(result).toEqual([]);
        expect(connection.getMultipleAccountsInfo).not.toHaveBeenCalled();
    });

    it('should resolve a single lookup table', async () => {
        const connection = mockConnection([accountInfo(ALT_3_ADDRS)]);
        const msg = message([{ accountKey: ALT_KEY_1, readonlyIndexes: [0, 1, 2], writableIndexes: [] }]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toHaveLength(1);
        expect(result[0].key.toBase58()).toBe(ALT_KEY_1.toBase58());
        expect(result[0].state.addresses.map(a => a.toBase58())).toEqual(ALT_3_EXPECTED_ADDRESSES);
    });

    it('should resolve multiple lookup tables', async () => {
        const connection = mockConnection([accountInfo(ALT_3_ADDRS), accountInfo(ALT_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [], writableIndexes: [0] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toHaveLength(2);
        expect(result[0].key.toBase58()).toBe(ALT_KEY_1.toBase58());
        expect(result[1].key.toBase58()).toBe(ALT_KEY_2.toBase58());
        expect(result[1].state.addresses.map(a => a.toBase58())).toEqual(ALT_2_EXPECTED_ADDRESSES);
    });

    /**
     * A partial list would leave `message.getAccountKeys` to notice, which throws a generic "Failed to
     * find address lookup table account" — losing which table failed and why. `useSimulation` renders
     * this message to the user, so it has to name the table and say what happened.
     */
    it('should throw naming the table when the RPC returns no account for one', async () => {
        const connection = mockConnection([null, accountInfo(ALT_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [0], writableIndexes: [] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        await expect(resolveAddressLookupTables(connection, msg)).rejects.toThrow(
            `Address lookup table ${ALT_KEY_1.toBase58()} could not be loaded`,
        );
    });

    it('should batch all keys into a single RPC call', async () => {
        const connection = mockConnection([accountInfo(ALT_3_ADDRS), accountInfo(ALT_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [], writableIndexes: [0] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [], writableIndexes: [0] },
        ]);

        await resolveAddressLookupTables(connection, msg);

        expect(connection.getMultipleAccountsInfo).toHaveBeenCalledTimes(1);
        expect(connection.getMultipleAccountsInfo).toHaveBeenCalledWith([ALT_KEY_1, ALT_KEY_2]);
    });

    // Reports the first missing table rather than a count, so the message points at something actionable.
    it('should throw on the first table when none of them load', async () => {
        const connection = mockConnection([null, null]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [0], writableIndexes: [] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        await expect(resolveAddressLookupTables(connection, msg)).rejects.toThrow(
            `Address lookup table ${ALT_KEY_1.toBase58()} could not be loaded`,
        );
    });
});

function accountInfo(base64Data: string): AccountInfo<Uint8Array> {
    return {
        data: fromBase64(base64Data),
        executable: false,
        lamports: 1_000_000,
        owner: new PublicKey('AddressLookupTab1e1111111111111111111111111'),
        rentEpoch: 0,
    };
}

function mockConnection(results: (AccountInfo<Uint8Array> | null)[]): Connection {
    // Partial mock — only getMultipleAccountsInfo is called
    return {
        getMultipleAccountsInfo: vi.fn().mockResolvedValue(results),
    } as unknown as Connection;
}

function message(lookups: { accountKey: PublicKey; writableIndexes: number[]; readonlyIndexes: number[] }[]) {
    // Partial mock — only addressTableLookups is accessed
    return { addressTableLookups: lookups } as unknown as VersionedMessage;
}
