import {
    getPerpMarketFromPerpMarketConfig,
    getSpotMarketFromSpotMarketConfig,
    Market,
    PerpMarket,
    PerpMarketConfig,
    SpotMarketConfig,
} from '@explorer/decoder-mango';
import { PublicKey } from '@solana/web3.js';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MANGO_V3_PROGRAM_ID } from '../../const';
import { useMangoPerpMarket, useMangoSpotMarket } from '../use-mango-market';

vi.mock('@providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        url: 'https://mainnet.rpc.address',
    })),
}));

vi.mock('@explorer/decoder-mango', () => ({
    getPerpMarketFromPerpMarketConfig: vi.fn(),
    getSpotMarketFromSpotMarketConfig: vi.fn(),
}));

const perpMarketConfig = { publicKey: PublicKey.default } as unknown as PerpMarketConfig;
const spotMarketConfig = { publicKey: PublicKey.default } as unknown as SpotMarketConfig;
const programId = new PublicKey(MANGO_V3_PROGRAM_ID);

describe('useMangoPerpMarket', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when config is undefined', () => {
        const { result } = renderHook(() => useMangoPerpMarket(undefined));

        expect(result.current).toBeNull();
        expect(getPerpMarketFromPerpMarketConfig).not.toHaveBeenCalled();
    });

    it('returns the resolved perp market when config is provided', async () => {
        const resolved = { name: 'BTC-PERP' } as unknown as PerpMarket;
        vi.mocked(getPerpMarketFromPerpMarketConfig).mockResolvedValueOnce(resolved);

        const { result } = renderHook(() => useMangoPerpMarket(perpMarketConfig));

        await waitFor(() => {
            expect(result.current).toBe(resolved);
        });
        expect(getPerpMarketFromPerpMarketConfig).toHaveBeenCalledWith('https://mainnet.rpc.address', perpMarketConfig);
    });

    it('returns null when resolution throws', async () => {
        vi.mocked(getPerpMarketFromPerpMarketConfig).mockRejectedValueOnce(new Error('rpc failed'));

        const { result } = renderHook(() => useMangoPerpMarket(perpMarketConfig));

        await waitFor(() => {
            expect(getPerpMarketFromPerpMarketConfig).toHaveBeenCalled();
        });
        expect(result.current).toBeNull();
    });

    it('resets to null when config transitions from defined to undefined', async () => {
        const resolved = { name: 'BTC-PERP' } as unknown as PerpMarket;
        vi.mocked(getPerpMarketFromPerpMarketConfig).mockResolvedValueOnce(resolved);

        const { result, rerender } = renderHook(({ config }) => useMangoPerpMarket(config), {
            initialProps: { config: perpMarketConfig as PerpMarketConfig | undefined },
        });

        await waitFor(() => {
            expect(result.current).toBe(resolved);
        });

        rerender({ config: undefined });

        await waitFor(() => {
            expect(result.current).toBeNull();
        });
    });
});

describe('useMangoSpotMarket', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when config is undefined', () => {
        const { result } = renderHook(() => useMangoSpotMarket(programId, undefined));

        expect(result.current).toBeNull();
        expect(getSpotMarketFromSpotMarketConfig).not.toHaveBeenCalled();
    });

    it('returns the resolved spot market when config is provided', async () => {
        const resolved = { address: 'spot' } as unknown as Market;
        vi.mocked(getSpotMarketFromSpotMarketConfig).mockResolvedValueOnce(resolved);

        const { result } = renderHook(() => useMangoSpotMarket(programId, spotMarketConfig));

        await waitFor(() => {
            expect(result.current).toBe(resolved);
        });
        expect(getSpotMarketFromSpotMarketConfig).toHaveBeenCalledWith(
            programId,
            'https://mainnet.rpc.address',
            spotMarketConfig,
        );
    });

    it('returns null when resolver yields undefined', async () => {
        vi.mocked(getSpotMarketFromSpotMarketConfig).mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useMangoSpotMarket(programId, spotMarketConfig));

        await waitFor(() => {
            expect(getSpotMarketFromSpotMarketConfig).toHaveBeenCalled();
        });
        expect(result.current).toBeNull();
    });

    it('returns null when resolution throws', async () => {
        vi.mocked(getSpotMarketFromSpotMarketConfig).mockRejectedValueOnce(new Error('rpc failed'));

        const { result } = renderHook(() => useMangoSpotMarket(programId, spotMarketConfig));

        await waitFor(() => {
            expect(getSpotMarketFromSpotMarketConfig).toHaveBeenCalled();
        });
        expect(result.current).toBeNull();
    });
});
