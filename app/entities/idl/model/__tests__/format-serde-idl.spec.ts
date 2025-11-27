import { Idl as AnchorIdl } from '@coral-xyz/anchor';

import { extractProgramAddressFromIdlData } from '../../lib/utils';
import anchor029Devi from '../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import anchor029 from '../../mocks/anchor/reference-0.29.json';
import anchor030 from '../../mocks/anchor/reference-0.30.json';
import { formatSerdeIdl } from '../formatters/format-serde-idl';

describe('Implementation for `formatSerdeIdl`', () => {
    it('should work for devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH program', async () => {
        let idl: AnchorIdl;
        const address = extractProgramAddressFromIdlData(anchor029Devi);
        expect('0.1.0').toBe(anchor029Devi.version);
        expect(() => {
            idl = formatSerdeIdl(anchor029Devi, address);

            expect(idl?.metadata).toStrictEqual({ name: 'amm_v3', version: '0.1.0' });
            expect(idl?.address).toBe(address);
        }).not.toThrowError();
    });

    it('should work for devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH program', async () => {
        let idl: AnchorIdl;
        const address = extractProgramAddressFromIdlData(anchor030devi);
        expect('0.1.0').toBe(anchor030devi.metadata.version);
        expect(() => {
            idl = formatSerdeIdl(anchor030devi, address);

            expect(idl?.metadata).toStrictEqual({
                name: 'amm_v3',
                spec: '0.1.0',
                version: '0.1.0',
            });
            expect(idl?.address).toBe(address);
        }).not.toThrowError();
    });

    // https://github.com/solana-foundation/anchor/pull/2824
    // https://github.com/acheroncrypto/anchor/blob/fix-idl/tests/idl/programs/idl/src/lib.rs
    // https://www.diffchecker.com/JqI33i4w/
    it('should work for 0.29 reference program', async () => {
        let idl: AnchorIdl;
        const address = extractProgramAddressFromIdlData(anchor029, new Array(31).fill('1').concat(['2']).join(''));
        expect('0.1.0').toBe(anchor029.version);
        expect(() => {
            idl = formatSerdeIdl(anchor029, address);

            expect(idl?.metadata).toStrictEqual({
                name: 'idl',
                version: '0.1.0',
            });
            expect(idl?.address).toBe(address);
        }).not.toThrowError();
    });

    /**
     * Unsupported IDLs
     */

    /**
     * Account does not contain "kind" and it can not be parsed by "convertTypeDef"
     * https://github.com/solana-developers/helpers/blob/a7e75d04cd4a83e6276a12526e839b2bf1d7b774/src/lib/convertLegacyIdl.ts#L180
     *  {
     *      "name": "SomeZcAccount",
     *      "discriminator": [56, 72, 82, 194, 210, 35, 17, 191]
     *  },
     */
    it('should fail for 0.30 reference program', async () => {
        let idl: AnchorIdl;
        const address = extractProgramAddressFromIdlData(anchor030, new Array(31).fill('1').concat(['3']).join(''));
        expect('0.1.0').toBe(anchor030.metadata.version);
        expect(() => {
            idl = formatSerdeIdl(anchor030, address);
            console.log({ idl });
            expect(idl?.metadata).toStrictEqual({
                description: 'Created with Anchor',
                name: 'idl',
                version: '0.1.0',
            });
            expect(idl?.address).toBe(address);
        }).toThrowError(new TypeError("Cannot read properties of undefined (reading 'kind')"));
    });

    it('should work for 0.9.4 waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF program as it contains unsuported types', async () => {
        let idl: AnchorIdl;
        const address = extractProgramAddressFromIdlData(
            anchorLegacy094ShankWave,
            'waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF'
        );
        expect('0.9.4').toBe(anchorLegacy094ShankWave.version);
        expect(() => {
            idl = formatSerdeIdl(anchorLegacy094ShankWave, address);

            expect(idl?.metadata).toStrictEqual({
                name: 'orca_wavebreak_program',
                version: '0.9.4',
            });
            expect(idl?.address).toBe(address);
            expect([5, 0, 30, 0, 56, 16]).toEqual(
                getFieldLengths(['accounts', 'constants', 'errors', 'events', 'instructions', 'types'], idl)
            );
        }).not.toThrowError();
    });
});

type IdlStructs = Pick<AnchorIdl, 'accounts' | 'constants' | 'errors' | 'events' | 'instructions' | 'types'>;
function getFieldLengths(keys: Array<keyof IdlStructs>, idl?: IdlStructs) {
    if (!idl) throw new Error('IDL is absent');
    return keys.reduce((acc, key) => {
        if (key in idl) {
            const field = idl[key];
            const numberOfMembers = field?.length;
            return acc.concat(numberOfMembers ?? -1);
        }
        return acc;
    }, [] as number[]);
}
