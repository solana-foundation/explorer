import type { AccountInfo, Connection, VersionedMessage } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { fromBase64 } from '@/app/shared/lib/bytes';

import { resolveAddressLookupTables } from '../resolve-address-lookup-tables';

const ALT_KEY_1 = new PublicKey('5ZiE3vAkrdXBgyFL7KqG3RoEGBws8CjY8AsGq1MuR5My');
const ALT_KEY_2 = new PublicKey('DZboAojTvNwYbhW5rCARYLnWSKNumnd4khQG63aCxTfR');

const ADDR_3ZK = '3zK38YBP6u3BpLUpaa6QhRHh4VXdv3J8cmD24fFpuyqy';
const ADDR_SQDS = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
const ADDR_BGUMA = 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/** Real ALT account data from mainnet. Addresses: ADDR_3ZK, ADDR_SQDS, ADDR_BGUMA */
const ALT_FIXTURE_3_ADDRS =
    'AQAAAP//////////gCtDFAAAAABLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsZd/I1FvQKS++AWuQKFqovsXPlNsSwyHSVfjJIqctyAaBxM5H4iNouLFVXsiHrwku/H77tmyj9S+/aNSsnLeomIuA63k1KGmyJHRfWd2/iiZYyhPcaIEhJjUcrgfBpaU=';

/** Real ALT account data from mainnet. Addresses: TOKEN_PROGRAM, USDC_MINT */
const ALT_FIXTURE_2_ADDRS =
    'AQAAAP//////////gCtDFAAAAABLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8Aqcb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11h';

describe('resolveAddressLookupTables', () => {
    it('should return empty array when message has no lookups', async () => {
        const connection = mockConnection([]);
        const result = await resolveAddressLookupTables(connection, message([]));

        expect(result).toEqual([]);
        expect(connection.getMultipleAccountsInfo).not.toHaveBeenCalled();
    });

    it('should resolve a single lookup table', async () => {
        const connection = mockConnection([accountInfo(ALT_FIXTURE_3_ADDRS)]);
        const msg = message([{ accountKey: ALT_KEY_1, readonlyIndexes: [0, 1, 2], writableIndexes: [] }]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toHaveLength(1);
        expect(result[0].key.toBase58()).toBe(ALT_KEY_1.toBase58());
        expect(result[0].state.addresses.map(a => a.toBase58())).toEqual([ADDR_3ZK, ADDR_SQDS, ADDR_BGUMA]);
    });

    it('should resolve multiple lookup tables', async () => {
        const connection = mockConnection([accountInfo(ALT_FIXTURE_3_ADDRS), accountInfo(ALT_FIXTURE_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [], writableIndexes: [0] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toHaveLength(2);
        expect(result[0].key.toBase58()).toBe(ALT_KEY_1.toBase58());
        expect(result[1].key.toBase58()).toBe(ALT_KEY_2.toBase58());
        expect(result[1].state.addresses.map(a => a.toBase58())).toEqual([TOKEN_PROGRAM, USDC_MINT]);
    });

    it('should skip lookup tables where account info is null', async () => {
        const connection = mockConnection([null, accountInfo(ALT_FIXTURE_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [0], writableIndexes: [] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toHaveLength(1);
        expect(result[0].key.toBase58()).toBe(ALT_KEY_2.toBase58());
    });

    it('should batch all keys into a single RPC call', async () => {
        const connection = mockConnection([accountInfo(ALT_FIXTURE_3_ADDRS), accountInfo(ALT_FIXTURE_2_ADDRS)]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [], writableIndexes: [0] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [], writableIndexes: [0] },
        ]);

        await resolveAddressLookupTables(connection, msg);

        expect(connection.getMultipleAccountsInfo).toHaveBeenCalledTimes(1);
        expect(connection.getMultipleAccountsInfo).toHaveBeenCalledWith([ALT_KEY_1, ALT_KEY_2]);
    });

    it('should return empty array when all account infos are null', async () => {
        const connection = mockConnection([null, null]);
        const msg = message([
            { accountKey: ALT_KEY_1, readonlyIndexes: [0], writableIndexes: [] },
            { accountKey: ALT_KEY_2, readonlyIndexes: [0], writableIndexes: [] },
        ]);

        const result = await resolveAddressLookupTables(connection, msg);

        expect(result).toEqual([]);
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
