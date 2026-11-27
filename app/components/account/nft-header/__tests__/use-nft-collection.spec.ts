// @vitest-environment jsdom
import { isTokenProgramData, useAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNftCollection } from '../use-nft-collection';

vi.mock('@providers/accounts', () => ({
    isTokenProgramData: vi.fn(() => true),
    useAccountInfo: vi.fn(() => undefined),
    useFetchAccountInfo: vi.fn(() => vi.fn()),
}));

const ADDRESS = PublicKey.default.toBase58();

function makeInfo(name: string) {
    return { data: { data: { parsed: { nftData: { metadata: { name } } } } } };
}

describe('useNftCollection', () => {
    afterEach(() => {
        vi.mocked(useAccountInfo).mockReturnValue(undefined);
        vi.mocked(isTokenProgramData).mockReturnValue(true);
    });

    it('should trim NUL padding off the collection name once the account loads', () => {
        vi.mocked(useAccountInfo).mockReturnValue(makeInfo('Mad Lads\0\0\0') as never);

        expect(renderHook(() => useNftCollection(ADDRESS)).result.current).toEqual({ loaded: true, name: 'Mad Lads' });
    });

    it('should report loaded with no name when the metadata name is empty', () => {
        vi.mocked(useAccountInfo).mockReturnValue(makeInfo('') as never);

        expect(renderHook(() => useNftCollection(ADDRESS)).result.current).toEqual({ loaded: true, name: undefined });
    });

    it('should report not loaded while the account is still missing', () => {
        expect(renderHook(() => useNftCollection(ADDRESS)).result.current).toEqual({ loaded: false, name: undefined });
    });

    it('should report loaded with no name when the account is not token-program data', () => {
        vi.mocked(useAccountInfo).mockReturnValue(makeInfo('Mad Lads') as never);
        vi.mocked(isTokenProgramData).mockReturnValue(false);

        expect(renderHook(() => useNftCollection(ADDRESS)).result.current).toEqual({ loaded: true, name: undefined });
    });
});
