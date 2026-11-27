import type { EditionInfo } from '@entities/nft';
import { none, some } from '@metaplex-foundation/umi';
import { describe, expect, it } from 'vitest';

import { getEditionSummary } from '../model';

describe('getEditionSummary', () => {
    it.each([
        { expected: '1/1', info: master({ maxSupply: some(0n), supply: 0n }) },
        { expected: 'Master · 3 of 10 printed', info: master({ maxSupply: some(10n), supply: 3n }) },
        { expected: 'Master · 12 printed, open edition', info: master({ maxSupply: none(), supply: 12n }) },
        { expected: 'Print 3 of 10', info: print(3n, { maxSupply: some(10n), supply: 7n }) },
        { expected: 'Print 3, open edition', info: print(3n, { maxSupply: none(), supply: 7n }) },
        { expected: undefined, info: { edition: undefined, masterEdition: undefined } },
    ])('should read $expected', ({ info, expected }) => {
        expect(getEditionSummary(info)).toBe(expected);
    });
});

type MasterFields = Pick<NonNullable<EditionInfo['masterEdition']>, 'maxSupply' | 'supply'>;

function master(fields: MasterFields): EditionInfo {
    return { edition: undefined, masterEdition: { key: 6, ...fields } as EditionInfo['masterEdition'] };
}

function print(number: bigint, fields: MasterFields): EditionInfo {
    return {
        edition: { edition: number, key: 1, parent: '22222222222222222222222222222222' } as EditionInfo['edition'],
        masterEdition: { key: 6, ...fields } as EditionInfo['masterEdition'],
    };
}
