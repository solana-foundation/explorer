import { address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { makeAnsNameRecordData, makeTldHouseData } from '../../__tests__/fixtures';
import {
    ANS_NAME_RECORD_HEADER_SIZE,
    decodeAnsNameRecord,
    decodeTldHouse,
    getAnsDomainAddress,
    getAnsHashedName,
    getAnsNameAccountKey,
    getTldHouseKey,
} from '../ans-name-service';

// Ground-truth vectors produced by @onsol/tldparser 0.6.5, the reference implementation of ANS
// derivation. A change to the derivation that breaks these breaks every non-.sol domain lookup.
const DOMAIN_ADDRESS_VECTORS: [domainTld: string, nameAccountKey: string][] = [
    ['miester.poor', '6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB'],
    ['test.bonk', '9Ba2kDeUEzfQXsf3GkPUo9ygwGoU51KrTJ47kZwEhhQc'],
    ['toly.abc', '2PM7gmoFrxA2UH8yqMEnLzAvTybdjgbCxVWTtATSAuzM'],
    ['sub.test.bonk', 'BpWri4Vafy16oif4UyDHFifj3XCEn3j7tzkmUDbezhoy'],
];

// The .bonk TLD house PDA, locked against tldparser's findTldHouse('.bonk').
const BONK_TLD_HOUSE = address('FfCuWsnY8bstAWqY4E4Rk9qRoBcMHykjTwLrjupSpUqu');

describe('getAnsHashedName', () => {
    it('should match the reference digest', () => {
        expect(Buffer.from(getAnsHashedName('miester')).toString('hex')).toBe(
            'f107acd896a046d0b7235931f9902cfc561cba84ef68d6f230fe126c68ac12e3',
        );
        expect(Buffer.from(getAnsHashedName('.bonk')).toString('hex')).toBe(
            '08452c4020b5dd65f94235adc9ecc5a737edce39b8c69d87f84830f853980fe9',
        );
    });

    it('should not collide with the SPL Name Service prefix', async () => {
        const { getHashedName } = await import('../sns-name-service');
        expect(getAnsHashedName('test')).not.toEqual(getHashedName('test'));
    });
});

describe('getAnsDomainAddress', () => {
    it.each(DOMAIN_ADDRESS_VECTORS)('should derive the name account for %s', async (domainTld, expected) => {
        expect(await getAnsDomainAddress(domainTld)).toBe(expected);
    });

    it('should lowercase the domain before deriving', async () => {
        expect(await getAnsDomainAddress('TEST.BONK')).toBe('9Ba2kDeUEzfQXsf3GkPUo9ygwGoU51KrTJ47kZwEhhQc');
    });

    it('should return undefined for label counts ANS cannot register', async () => {
        expect(await getAnsDomainAddress('bonk')).toBeUndefined();
        expect(await getAnsDomainAddress('a.b.c.d')).toBeUndefined();
    });
});

describe('getTldHouseKey', () => {
    // Locked against tldparser's findTldHouse.
    it.each([
        ['.bonk', 'FfCuWsnY8bstAWqY4E4Rk9qRoBcMHykjTwLrjupSpUqu'],
        ['.poor', 'ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA'],
    ])('should derive the TLD house for %s', async (tld, expected) => {
        expect(await getTldHouseKey(tld)).toBe(expected);
    });

    it('should lowercase the TLD before deriving', async () => {
        expect(await getTldHouseKey('.BONK')).toBe(await getTldHouseKey('.bonk'));
    });
});

describe('getAnsNameAccountKey', () => {
    it('should derive the reverse-lookup account from a hashed pubkey and TLD house class', async () => {
        const hashed = getAnsHashedName('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb');

        expect(await getAnsNameAccountKey(hashed, { nameClass: BONK_TLD_HOUSE })).toBe(
            '8Az3w476HXK9hs3ho2sRK3VZeFKaN4gC9yriwG6jBtjh',
        );
    });
});

describe('decodeAnsNameRecord', () => {
    const PARENT = address('BV9TTYfzBiSMz3JCjqMoHqN62gFJDKPJmRhxjgqKH1N4');
    const OWNER = address('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb');

    function record(overrides: { expiresAt?: bigint; payload?: Uint8Array } = {}): Uint8Array {
        return makeAnsNameRecordData({ owner: OWNER, parentName: PARENT, ...overrides });
    }

    it('should decode parent and owner from a bare header', () => {
        const decoded = decodeAnsNameRecord(record());

        expect(decoded).toMatchObject({ isValid: true, owner: OWNER, parentName: PARENT });
    });

    it('should treat a zero expiry as never expiring', () => {
        expect(decodeAnsNameRecord(record({ expiresAt: 0n }))?.isValid).toBe(true);
    });

    it('should keep records valid through the 45-day grace period', () => {
        const expiredYesterday = BigInt(Math.floor(Date.now() / 1000) - 24 * 60 * 60);

        expect(decodeAnsNameRecord(record({ expiresAt: expiredYesterday }))?.isValid).toBe(true);
    });

    it('should invalidate records expired past the grace period and hide their owner', () => {
        const expiresAt = BigInt(Math.floor(Date.now() / 1000) - 46 * 24 * 60 * 60);
        const decoded = decodeAnsNameRecord(record({ expiresAt }));

        expect(decoded?.isValid).toBe(false);
        expect(decoded?.owner).toBeUndefined();
        expect(decoded?.name).toBeUndefined();
    });

    it('should read the reverse-lookup name up to the first NUL byte', () => {
        const payload = new TextEncoder().encode('alice\0\0\0');

        expect(decodeAnsNameRecord(record({ payload }))?.name).toBe('alice');
    });

    it('should read an unterminated payload to its end', () => {
        const payload = new TextEncoder().encode('alice');

        expect(decodeAnsNameRecord(record({ payload }))?.name).toBe('alice');
    });

    it('should report no name when the payload is empty or all NULs', () => {
        expect(decodeAnsNameRecord(record())?.name).toBeUndefined();
        expect(decodeAnsNameRecord(record({ payload: new Uint8Array(10) }))?.name).toBeUndefined();
    });

    it('should return undefined when the account is too short to hold a header', () => {
        expect(decodeAnsNameRecord(new Uint8Array(ANS_NAME_RECORD_HEADER_SIZE - 1))).toBeUndefined();
    });
});

describe('decodeTldHouse', () => {
    const PARENT = address('BV9TTYfzBiSMz3JCjqMoHqN62gFJDKPJmRhxjgqKH1N4');

    it('should parse the TLD name and parent account', () => {
        expect(decodeTldHouse(makeTldHouseData('.bonk', PARENT))).toEqual({ parentAccount: PARENT, tld: '.bonk' });
    });

    it('should truncate the TLD name at the first NUL byte', () => {
        expect(decodeTldHouse(makeTldHouseData('.bonk\0x', PARENT))?.tld).toBe('.bonk');
    });

    it('should return undefined when the account is too short to hold the declared fields', () => {
        expect(decodeTldHouse(new Uint8Array(100))).toBeUndefined();
        // Declares a longer name than the account holds
        expect(decodeTldHouse(makeTldHouseData('.bonk', PARENT).subarray(0, 110))).toBeUndefined();
    });
});
