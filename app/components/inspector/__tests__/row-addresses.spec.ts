import { AddressLookupTableAccount, PublicKey, type VersionedMessage } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { rowAddresses } from '../row-addresses';

const STATIC_A = PublicKey.default;
const STATIC_B = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const LOOKED_UP_A = new PublicKey('So11111111111111111111111111111111111111112');
const LOOKED_UP_B = new PublicKey('SysvarC1ock11111111111111111111111111111111');
const TABLE_KEY = new PublicKey('AddressLookupTab1e1111111111111111111111111');

function message(overrides: Partial<VersionedMessage> = {}): VersionedMessage {
    return {
        addressTableLookups: [],
        staticAccountKeys: [STATIC_A, STATIC_B],
        ...overrides,
    } as unknown as VersionedMessage;
}

function lookup(writableIndexes: number[], readonlyIndexes: number[]) {
    return { accountKey: TABLE_KEY, readonlyIndexes, writableIndexes };
}

function table(addresses: PublicKey[]) {
    return [new AddressLookupTableAccount({ key: TABLE_KEY, state: { addresses } as never }), 'fetched'] as const;
}

describe('rowAddresses', () => {
    it('should return the static keys when the message looks nothing up', () => {
        expect(rowAddresses(message(), [])).toEqual([STATIC_A.toBase58(), STATIC_B.toBase58()]);
    });

    it('should include both writable and readonly looked-up accounts', () => {
        const msg = message({ addressTableLookups: [lookup([0], [1])] } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [table([LOOKED_UP_A, LOOKED_UP_B])])).toEqual([
            STATIC_A.toBase58(),
            STATIC_B.toBase58(),
            LOOKED_UP_A.toBase58(),
            LOOKED_UP_B.toBase58(),
        ]);
    });

    it('should count an address that is both static and looked up once', () => {
        const msg = message({ addressTableLookups: [lookup([0], [])] } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [table([STATIC_B])])).toEqual([STATIC_A.toBase58(), STATIC_B.toBase58()]);
    });

    it('should skip a table that has not loaded', () => {
        const msg = message({ addressTableLookups: [lookup([0], [])] } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [undefined])).toEqual([STATIC_A.toBase58(), STATIC_B.toBase58()]);
    });

    it('should skip a table the provider could not parse', () => {
        const msg = message({ addressTableLookups: [lookup([0], [])] } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [['Invalid Lookup Table', 'fetched'] as const])).toEqual([
            STATIC_A.toBase58(),
            STATIC_B.toBase58(),
        ]);
    });

    it('should skip an index the table does not hold', () => {
        const msg = message({ addressTableLookups: [lookup([7], [0])] } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [table([LOOKED_UP_A])])).toEqual([
            STATIC_A.toBase58(),
            STATIC_B.toBase58(),
            LOOKED_UP_A.toBase58(),
        ]);
    });

    it('should read every table the message names', () => {
        const msg = message({
            addressTableLookups: [lookup([0], []), lookup([], [0])],
        } as Partial<VersionedMessage>);

        expect(rowAddresses(msg, [table([LOOKED_UP_A]), table([LOOKED_UP_B])])).toEqual([
            STATIC_A.toBase58(),
            STATIC_B.toBase58(),
            LOOKED_UP_A.toBase58(),
            LOOKED_UP_B.toBase58(),
        ]);
    });
});
