import { describe, expect, it } from 'vitest';

import type { KeyValueRow } from '@/app/shared/ui/key-value';

import type { NftHeaderModel } from '../model';
import { nftOverviewRows } from '../overview-rows';

const MODEL: NftHeaderModel = {
    compressed: false,
    creators: null,
    mutable: true,
    name: 'Cool NFT #42',
    typeLabel: 'Metaplex NFT',
};

describe('nftOverviewRows', () => {
    it.each([
        { expected: 'Primary Market', primarySaleHappened: false },
        { expected: 'Secondary Market', primarySaleHappened: true },
    ])('should show the market as $expected, then the metadata', ({ primarySaleHappened, expected }) => {
        const rows = nftOverviewRows({ ...MODEL, primarySaleHappened }).filter(Boolean) as KeyValueRow[];

        expect(rows.map(row => row.label)).toEqual(['Market', 'Metadata']);
        expect(rows[0].value).toBe(expected);
    });

    it('should add no market row for a compressed NFT, which carries no primary-sale flag', () => {
        const rows = nftOverviewRows(MODEL).filter(Boolean) as KeyValueRow[];

        expect(rows.map(row => row.label)).toEqual(['Metadata']);
    });
});
