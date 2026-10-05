import { address, getAddressEncoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { SNS_PARENT_NAME_ACCOUNT } from '../constants';
import {
    decodeNameRegistryOwner,
    formatSnsName,
    getHashedName,
    getNameAccountKey,
    getSnsNameAccount,
    NAME_REGISTRY_HEADER_SIZE,
    parseSnsLabel,
} from '../sns-name-service';

const BONFIDA_SDK_VECTORS: [label: string, nameAccountKey: string][] = [
    ['bonfida', 'Crf8hzfthWGbGbLTVCiqRqV5MVnbpHB1L9KQMd6gsinb'],
    ['toly', 'FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q'],
    ['a', 'ELoM9Yo5jdNE64uV7y9oQNG5yB9Npk6S518rRWDJ5hxy'],
    ['solana-explorer', 'BkoGi4aGyaEiS2Zt4WaWjeko2adtFZt5oHrfETBYJo8b'],
    ['ünïcödé', 'GxqfK8AMUK6GSiPcFi3eFuPEUJLqr2TQJm8nPrDvyVkT'],
];

describe('formatSnsName', () => {
    it('should append the .sns TLD', () => {
        expect(formatSnsName('toly')).toBe('toly.sns');
    });
});

describe('parseSnsLabel', () => {
    it.each(BONFIDA_SDK_VECTORS)('should invert formatSnsName for %s', label => {
        expect(parseSnsLabel(formatSnsName(label))).toBe(label);
    });

    it.each([['toly.sol'], ['toly.bonk'], ['tolysns'], ['toly.sns.sol']])('should return undefined for %s', domain => {
        expect(parseSnsLabel(domain)).toBeUndefined();
    });
});

describe('getSnsNameAccount', () => {
    it.each(BONFIDA_SDK_VECTORS)('should derive the .sns name account for %s', async (label, expected) => {
        expect(await getSnsNameAccount(label)).toBe(expected);
    });
});

describe('getHashedName', () => {
    it('should produce a 32-byte digest', () => {
        expect(getHashedName('bonfida')).toHaveLength(32);
    });

    it('should be case sensitive', () => {
        expect(getHashedName('Bonfida')).not.toEqual(getHashedName('bonfida'));
    });
});

describe('getNameAccountKey', () => {
    it('should derive a different account without a parent', async () => {
        const hashedName = getHashedName('bonfida');

        expect(await getNameAccountKey(hashedName)).not.toBe(
            await getNameAccountKey(hashedName, { nameParent: SNS_PARENT_NAME_ACCOUNT }),
        );
    });
});

describe('decodeNameRegistryOwner', () => {
    const addressEncoder = getAddressEncoder();
    const OWNER = address('FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q');

    function header(trailingBytes = 0): Uint8Array {
        const data = new Uint8Array(NAME_REGISTRY_HEADER_SIZE + trailingBytes);
        data.set(addressEncoder.encode(SNS_PARENT_NAME_ACCOUNT), 0);
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
