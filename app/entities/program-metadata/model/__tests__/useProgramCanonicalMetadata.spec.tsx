import { SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, SolanaError } from '@solana/kit';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { getProgramCanonicalMetadata, IDL_SEED } from '../../api/getProgramCanonicalMetadata';
import { useProgramCanonicalMetadata } from '../useProgramCanonicalMetadata';

vi.mock('../../api/getProgramCanonicalMetadata', async () => {
    const actual = await vi.importActual<typeof import('../../api/getProgramCanonicalMetadata')>(
        '../../api/getProgramCanonicalMetadata',
    );
    return {
        ...actual,
        getProgramCanonicalMetadata: vi.fn(),
    };
});

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: {
        error: vi.fn(),
    },
}));

const PROGRAM_ADDRESS = '72RmHgLprptX1iZDJqmMD5vroTqo8N2tJ6YWoFjFNDgj';
const CUSTOM_RPC_URL = 'https://402.surfnet.dev:8899';

function swrWrapper({ children }: { children: React.ReactNode }) {
    // Fresh cache per test so SWR doesn't reuse a previous test's result for the same key.
    return React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children);
}

function renderUseProgramCanonicalMetadata() {
    return renderHook(
        () =>
            useProgramCanonicalMetadata(PROGRAM_ADDRESS, IDL_SEED, CUSTOM_RPC_URL, Cluster.Custom, /* enabled */ true),
        { wrapper: swrWrapper },
    );
}

describe('useProgramCanonicalMetadata — direct RPC path', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null silently when the metadata account does not exist', async () => {
        vi.mocked(getProgramCanonicalMetadata).mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: PROGRAM_ADDRESS }),
        );

        const { result } = renderUseProgramCanonicalMetadata();

        await waitFor(() => {
            expect(result.current.programMetadata).toBeNull();
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should return null and log when an unexpected error occurs', async () => {
        vi.mocked(getProgramCanonicalMetadata).mockRejectedValueOnce(new Error('Network down'));

        const { result } = renderUseProgramCanonicalMetadata();

        await waitFor(() => {
            expect(result.current.programMetadata).toBeNull();
        });
        expect(Logger.error).toHaveBeenCalledTimes(1);
    });

    it('should return the resolved metadata on success', async () => {
        const metadata = { instructions: [], name: 'test_program', version: '0.1.0' };
        vi.mocked(getProgramCanonicalMetadata).mockResolvedValueOnce(metadata);

        const { result } = renderUseProgramCanonicalMetadata();

        await waitFor(() => {
            expect(result.current.programMetadata).toEqual(metadata);
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should not call the fetcher when disabled', async () => {
        const { result } = renderHook(
            () =>
                useProgramCanonicalMetadata(
                    PROGRAM_ADDRESS,
                    IDL_SEED,
                    CUSTOM_RPC_URL,
                    Cluster.Custom,
                    /* enabled */ false,
                ),
            { wrapper: swrWrapper },
        );

        await waitFor(() => {
            expect(result.current.programMetadata).toBeNull();
        });
        expect(getProgramCanonicalMetadata).not.toHaveBeenCalled();
    });
});
