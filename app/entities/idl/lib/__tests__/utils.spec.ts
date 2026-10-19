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
        ['an Anchor 0.30 IDL', anchor030, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL', anchor029, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL with an empty root address', { ...anchor029, address: '' }, ANCHOR_ADDRESS],
        [
            'an Anchor IDL with a program public key',
            { ...anchor030, program: { publicKey: OTHER_ADDRESS } },
            ANCHOR_ADDRESS,
        ],
    ])('should return the address that %s declares', (_, idl, address) => {
        expect(getIdlDeclaredAddress(idl)).toEqual({ address, kind: 'address' });
    });

    it.each([
        ['an IDL that declares no address', anchorNoAddress],
        ['an IDL that declares an empty address', { ...anchorNoAddress, metadata: { address: '' } }],
        ['a root node without the Codama standard', { kind: 'rootNode', program: { publicKey: OTHER_ADDRESS } }],
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
    ])('should return a malformed address for %s', (_, idl) => {
        expect(getIdlDeclaredAddress(idl)).toEqual({ kind: 'malformed' });
    });

    it('should prefer the root address over metadata.address', () => {
        const idl = { ...anchor030, metadata: { ...anchor030.metadata, address: OTHER_ADDRESS } };

        expect(getIdlDeclaredAddress(idl)).toEqual({ address: ANCHOR_ADDRESS, kind: 'address' });
    });
});
