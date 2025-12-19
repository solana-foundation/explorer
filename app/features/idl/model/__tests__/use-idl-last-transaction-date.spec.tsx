import { Connection } from '@solana/web3.js';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdlVariant, useIdlLastTransactionDate } from '../use-idl-last-transaction-date';

vi.mock('@providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        url: 'https://mainnet.rpc.address',
    })),
}));

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn(),
        PublicKey: actual.PublicKey,
    };
});

vi.mock('@solana/kit', () => ({
    address: vi.fn((addr: string) => addr),
    createSolanaRpc: vi.fn(() => ({})),
}));

vi.mock('@solana-program/program-metadata', () => ({
    fetchMetadataFromSeeds: vi.fn(),
}));

const mockConnection = {
    getSignaturesForAddress: vi.fn(),
};

describe('useIdlLastTransactionDate', () => {
    const programId = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Connection).mockImplementation(() => mockConnection as any);
    });

    it('should return ProgramMetadata variant when neither IDL exists', () => {
        const { result } = renderHook(() => useIdlLastTransactionDate(programId, false, false));

        expect(result.current).toBe(IdlVariant.ProgramMetadata);
    });

    it('should return Anchor variant when only Anchor IDL exists', () => {
        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, false));

        expect(result.current).toBe(IdlVariant.Anchor);
    });

    it('should return ProgramMetadata variant when only PMP IDL exists', () => {
        const { result } = renderHook(() => useIdlLastTransactionDate(programId, false, true));

        expect(result.current).toBe(IdlVariant.ProgramMetadata);
    });

    it('should return ProgramMetadata variant when programId is null', () => {
        const { result } = renderHook(() => useIdlLastTransactionDate(null, true, true));

        expect(result.current).toBe(IdlVariant.ProgramMetadata);
    });

    it('should prefer Anchor IDL when Anchor timestamp is more recent', async () => {
        const anchorTimestamp = 1700000000;
        const pmpTimestamp = 1699999000;

        mockConnection.getSignaturesForAddress
            .mockResolvedValueOnce([{ blockTime: anchorTimestamp }])
            .mockResolvedValueOnce([{ blockTime: pmpTimestamp }]);

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.Anchor);
            },
            { timeout: 1000 }
        );
    });

    it('should prefer ProgramMetadata IDL when PMP timestamp is more recent', async () => {
        const anchorTimestamp = 1699999000;
        const pmpTimestamp = 1700000000;

        mockConnection.getSignaturesForAddress
            .mockResolvedValueOnce([{ blockTime: anchorTimestamp }])
            .mockResolvedValueOnce([{ blockTime: pmpTimestamp }]);

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.ProgramMetadata);
            },
            { timeout: 1000 }
        );
    });

    it('should prefer ProgramMetadata IDL when both timestamps are equal', async () => {
        const timestamp = 1700000000;

        mockConnection.getSignaturesForAddress
            .mockResolvedValueOnce([{ blockTime: timestamp }])
            .mockResolvedValueOnce([{ blockTime: timestamp }]);

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.ProgramMetadata);
            },
            { timeout: 1000 }
        );
    });

    it('should fallback to Anchor IDL when PMP timestamp fetch fails', async () => {
        const anchorTimestamp = 1700000000;

        mockConnection.getSignaturesForAddress
            .mockResolvedValueOnce([{ blockTime: anchorTimestamp }])
            .mockRejectedValueOnce(new Error('PMP fetch failed'));

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.Anchor);
            },
            { timeout: 1000 }
        );
    });

    it('should fallback to ProgramMetadata when Anchor timestamp fetch fails', async () => {
        const pmpTimestamp = 1700000000;

        mockConnection.getSignaturesForAddress
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ blockTime: pmpTimestamp }]);

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.ProgramMetadata);
            },
            { timeout: 1000 }
        );
    });

    it('should fallback to ProgramMetadata when both timestamp fetches fail', async () => {
        mockConnection.getSignaturesForAddress.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

        const { fetchMetadataFromSeeds } = await import('@solana-program/program-metadata');
        vi.mocked(fetchMetadataFromSeeds).mockResolvedValue({
            address: 'metadataAddress123',
        } as any);

        const { result } = renderHook(() => useIdlLastTransactionDate(programId, true, true));

        await waitFor(
            () => {
                expect(result.current).toBe(IdlVariant.ProgramMetadata);
            },
            { timeout: 1000 }
        );
    });
});
