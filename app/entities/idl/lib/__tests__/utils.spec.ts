import anchor029 from '@entities/idl/mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030 from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorNoAddress from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codama from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { describe, expect, it } from 'vitest';

import { getIdlDeclaredAddress } from '../utils';

const ANCHOR_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

describe('getIdlDeclaredAddress', () => {
    it.each([
        ['a Codama root', codama, 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S'],
        ['an Anchor 0.30 IDL', anchor030, ANCHOR_ADDRESS],
        ['a legacy Anchor IDL', anchor029, ANCHOR_ADDRESS],
        ['an IDL that declares no address', anchorNoAddress, undefined],
        ['an IDL that declares an empty address', { ...anchorNoAddress, metadata: { address: '' } }, undefined],
        [
            'a Codama root whose program public key is not a string',
            { ...codama, program: { ...codama.program, publicKey: 1 } },
            undefined,
        ],
        [
            'an Anchor IDL with a program public key',
            { ...anchor030, program: { publicKey: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq' } },
            ANCHOR_ADDRESS,
        ],
        ['null', null, undefined],
        ['a string', 'idl', undefined],
    ])('should read the address from %s', (_, idl, address) => {
        expect(getIdlDeclaredAddress(idl)).toBe(address);
    });

    it('should prefer the root address over metadata.address', () => {
        const idl = {
            ...anchor030,
            metadata: { ...anchor030.metadata, address: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq' },
        };

        expect(getIdlDeclaredAddress(idl)).toBe(ANCHOR_ADDRESS);
    });
});
