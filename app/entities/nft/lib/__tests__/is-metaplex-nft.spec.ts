import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { some } from '@metaplex-foundation/umi';
import { describe, expect, it } from 'vitest';

import { isMetaplexNFT } from '@/app/entities/nft';
import type { TokenProgramData } from '@/app/providers/accounts';
import type { MintAccountInfo } from '@/app/validators/accounts/token';

import { makeMetadata } from './make-nft-data';

function makeMintInfo(overrides: Partial<MintAccountInfo> = {}): MintAccountInfo {
    return {
        decimals: 0,
        freezeAuthority: null,
        isInitialized: true,
        mintAuthority: null,
        supply: '1',
        ...overrides,
    };
}

function makeTokenProgramData(
    overrides: { tokenStandard?: TokenStandard | null; hasNftData?: boolean } = {},
): TokenProgramData {
    const { tokenStandard = null, hasNftData = true } = overrides;
    return {
        nftData: hasNftData
            ? {
                  editionInfo: {},
                  json: undefined,
                  metadata: makeMetadata(tokenStandard != null ? { tokenStandard: some(tokenStandard) } : {}),
              }
            : undefined,
        parsed: { info: {}, type: 'mint' } as any,
        program: 'spl-token' as const,
    };
}

describe('isMetaplexNFT', () => {
    it('returns true for standard NFT with supply=1', () => {
        const parsedData = makeTokenProgramData();
        const mintInfo = makeMintInfo({ supply: '1' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(true);
    });

    it('returns true for NonFungible tokenStandard (0) even with supply > 1', () => {
        const parsedData = makeTokenProgramData({ tokenStandard: TokenStandard.NonFungible });
        const mintInfo = makeMintInfo({ supply: '100' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(true);
    });

    it('returns true for NonFungibleEdition tokenStandard (3)', () => {
        const parsedData = makeTokenProgramData({ tokenStandard: TokenStandard.NonFungibleEdition });
        const mintInfo = makeMintInfo({ supply: '100' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(true);
    });

    it('returns true for ProgrammableNonFungible tokenStandard (4)', () => {
        const parsedData = makeTokenProgramData({ tokenStandard: TokenStandard.ProgrammableNonFungible });
        const mintInfo = makeMintInfo({ supply: '100' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(true);
    });

    it('returns false when decimals > 0', () => {
        const parsedData = makeTokenProgramData();
        const mintInfo = makeMintInfo({ decimals: 6 });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(false);
    });

    it('returns false when parsedData is undefined', () => {
        const mintInfo = makeMintInfo();
        expect(isMetaplexNFT(undefined, mintInfo)).toBe(false);
    });

    it('returns false when nftData is absent', () => {
        const parsedData = makeTokenProgramData({ hasNftData: false });
        const mintInfo = makeMintInfo();
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(false);
    });

    it('returns false when parsed type is not mint', () => {
        const parsedData = makeTokenProgramData();
        (parsedData.parsed as any).type = 'account';
        const mintInfo = makeMintInfo();
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(false);
    });

    it('returns false for FungibleAsset tokenStandard (1) with supply > 1', () => {
        const parsedData = makeTokenProgramData({ tokenStandard: TokenStandard.FungibleAsset });
        const mintInfo = makeMintInfo({ supply: '100' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(false);
    });

    it('returns false for Fungible tokenStandard (2) with supply > 1', () => {
        const parsedData = makeTokenProgramData({ tokenStandard: TokenStandard.Fungible });
        const mintInfo = makeMintInfo({ supply: '100' });
        expect(isMetaplexNFT(parsedData, mintInfo)).toBe(false);
    });
});
