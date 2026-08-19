import { address, getAddressEncoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { SOL_TLD_AUTHORITY } from '../../api/constants';
import {
    decodeNameRegistryOwner,
    getHashedName,
    getNameAccountKey,
    NAME_REGISTRY_HEADER_SIZE,
} from '../sns-name-service';

// Ground-truth vectors produced by @bonfida/spl-name-service 0.1.30, the reference implementation
// of SPL Name Service derivation. A change to the derivation that breaks these breaks .sol lookups.
const SOL_DOMAIN_VECTORS: [name: string, nameAccountKey: string][] = [
    ['bonfida', 'Crf8hzfthWGbGbLTVCiqRqV5MVnbpHB1L9KQMd6gsinb'],
    ['toly', 'FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q'],
    ['a', 'ELoM9Yo5jdNE64uV7y9oQNG5yB9Npk6S518rRWDJ5hxy'],
    ['solana-explorer', 'BkoGi4aGyaEiS2Zt4WaWjeko2adtFZt5oHrfETBYJo8b'],
    ['ünïcödé', 'GxqfK8AMUK6GSiPcFi3eFuPEUJLqr2TQJm8nPrDvyVkT'],
];

describe('getHashedName', () => {
    it('should produce a 32-byte digest', () => {
        expect(getHashedName('bonfida')).toHaveLength(32);
    });

    it('should be case sensitive', () => {
        expect(getHashedName('Bonfida')).not.toEqual(getHashedName('bonfida'));
    });
});

describe('getNameAccountKey', () => {
    it.each(SOL_DOMAIN_VECTORS)('should derive the .sol name account for %s', async (name, expected) => {
        const nameAccountKey = await getNameAccountKey(getHashedName(name), { nameParent: SOL_TLD_AUTHORITY });

        expect(nameAccountKey).toBe(expected);
    });

    it('should derive a different account without a parent', async () => {
        const hashedName = getHashedName('bonfida');

        expect(await getNameAccountKey(hashedName)).not.toBe(
            await getNameAccountKey(hashedName, { nameParent: SOL_TLD_AUTHORITY }),
        );
    });
});

describe('decodeNameRegistryOwner', () => {
    const addressEncoder = getAddressEncoder();
    const OWNER = address('FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q');

    function header(trailingBytes = 0): Uint8Array {
        const data = new Uint8Array(NAME_REGISTRY_HEADER_SIZE + trailingBytes);
        data.set(addressEncoder.encode(SOL_TLD_AUTHORITY), 0);
        data.set(addressEncoder.encode(OWNER), 32);
        return data;
    }

    it('should read the owner from a bare header', () => {
        expect(decodeNameRegistryOwner(header())).toBe(OWNER);
    });

    it('should ignore free-form data past the header', () => {
        expect(decodeNameRegistryOwner(header(64))).toBe(OWNER);
    });

    it('should return undefined when the account is too short to hold a header', () => {
        expect(decodeNameRegistryOwner(new Uint8Array(NAME_REGISTRY_HEADER_SIZE - 1))).toBeUndefined();
    });
});
