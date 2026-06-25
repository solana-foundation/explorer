import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramMetadataIdl } from '../use-program-metadata-idl';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

// The label is a thin selector over the shared `useProgramIdls` resolution (the known/custom-cluster
// resolution itself is covered by use-program-idls.spec); mock it and assert the projection + the
// suspense forwarding.
vi.mock('@entities/idl/@x/program-metadata', () => ({ useProgramIdls: mocks.useProgramIdls }));

const PROGRAM = '72RmHgLprptX1iZDJqmMD5vroTqo8N2tJ6YWoFjFNDgj';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

describe('useProgramMetadataIdl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should surface the programMetadataIdl from the shared resolution', () => {
        mocks.useProgramIdls.mockReturnValue({
            anchorIdl: { name: 'anchor_idl' },
            isLoading: false,
            programMetadataIdl: { name: 'pmp_idl' },
        });

        const { result } = renderHook(() => useProgramMetadataIdl(PROGRAM, RPC_URL, Cluster.MainnetBeta));

        expect(result.current.programMetadataIdl).toEqual({ name: 'pmp_idl' });
        expect(result.current.isLoading).toBe(false);
        expect(mocks.useProgramIdls).toHaveBeenCalledWith(PROGRAM, RPC_URL, Cluster.MainnetBeta, { suspense: false });
    });

    it('should forward the suspense flag to the shared resolution', () => {
        mocks.useProgramIdls.mockReturnValue({ anchorIdl: undefined, isLoading: true, programMetadataIdl: undefined });

        renderHook(() => useProgramMetadataIdl(PROGRAM, RPC_URL, Cluster.MainnetBeta, true));

        expect(mocks.useProgramIdls).toHaveBeenCalledWith(PROGRAM, RPC_URL, Cluster.MainnetBeta, { suspense: true });
    });
});
