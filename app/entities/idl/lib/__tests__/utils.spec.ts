import anchor029 from '@entities/idl/mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030 from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorNoAddress from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codama from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { describe, expect, it } from 'vitest';

import { getIdlDeclaredAddress } from '../utils';

const ANCHOR_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const OTHER_ADDRESS = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

describe('getIdlDeclaredAddress', () => {
    it.each([
        ['a Codama root', codama, 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S'],
        ['a Kinobi root', { ...codama, standard: 'kinobi' }, 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S'],
        ['a Codama root without a kind', { program: { publicKey: OTHER_ADDRESS }, standard: 'codama' }, OTHER_ADDRESS],
        ['an Anchor 0.30 IDL', anchor030, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL', anchor029, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL with an empty root address', { ...anchor029, address: '' }, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL with a null root address', { ...anchor029, address: null }, ANCHOR_ADDRESS],
    ])('should return the address that %s declares', (_, idl, address) => {
        expect(getIdlDeclaredAddress(idl)).toEqual({ address, kind: 'address' });
    });

    it.each([
        ['an IDL that declares no address', anchorNoAddress],
        ['an IDL that declares an empty address', { ...anchorNoAddress, metadata: { address: '' } }],
        [
            'a Codama root with a null program public key',
            { ...codama, program: { ...codama.program, publicKey: null } },
        ],
        ['null', null],
        ['a string', 'idl'],
    ])('should return no address for %s', (_, idl) => {
        expect(getIdlDeclaredAddress(idl)).toEqual({ kind: 'none' });
    });

    it.each([
        [
            'a Codama root whose program public key is a number',
            { ...codama, program: { ...codama.program, publicKey: 1 } },
        ],
        ['an Anchor IDL whose address is an object', { ...anchor030, address: {} }],
        ['an Anchor IDL whose address is not base58', { ...anchor030, address: 'not-an-address' }],
    ])('should return a malformed address for %s', (_, idl) => {
        expect(getIdlDeclaredAddress(idl)).toEqual({ kind: 'malformed' });
    });

    it('should prefer the root address over metadata.address', () => {
        const idl = { ...anchor030, metadata: { ...anchor030.metadata, address: OTHER_ADDRESS } };

        expect(getIdlDeclaredAddress(idl)).toEqual({ address: ANCHOR_ADDRESS, kind: 'address' });
    });

    it('should ignore program.publicKey on an Anchor IDL', () => {
        const idl = { ...anchor030, program: { publicKey: OTHER_ADDRESS } };

        expect(getIdlDeclaredAddress(idl)).toEqual({ address: ANCHOR_ADDRESS, kind: 'address' });
    });
});
