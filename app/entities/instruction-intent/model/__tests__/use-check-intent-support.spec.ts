// @vitest-environment jsdom

import { DEFAULT_RPC_URL } from '@__fixtures__/gen';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { SYSTEM_PROGRAM_ADDRESS, SYSTEM_ROOT } from '../../mocks/fixtures';
import { useCheckIntentSupport } from '../use-check-intent-support';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

vi.mock('@entities/idl/@x/instruction-intent', () => ({ useProgramIdls: mocks.useProgramIdls }));
vi.mock('@entities/cluster/@x/instruction-intent', () => ({
    useCluster: () => ({ cluster: Cluster.Devnet, url: DEFAULT_RPC_URL }),
}));

function renderIntentSupport(idls: object) {
    mocks.useProgramIdls.mockReturnValue(idls);
    return renderHook(() => useCheckIntentSupport(SYSTEM_PROGRAM_ADDRESS)).result.current;
}

describe('useCheckIntentSupport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should request the IDLs of the program on the active cluster', () => {
        renderIntentSupport({ isLoading: true });

        expect(mocks.useProgramIdls).toHaveBeenCalledWith(SYSTEM_PROGRAM_ADDRESS, DEFAULT_RPC_URL, Cluster.Devnet);
    });

    it('should report loading when the IDL is loading', () => {
        expect(renderIntentSupport({ isLoading: true })).toEqual({ status: 'loading' });
    });

    it('should report failed when the IDL fetch fails', () => {
        expect(renderIntentSupport({ error: new Error('502'), isLoading: false })).toEqual({ status: 'failed' });
    });

    it('should report failed when SWR retries a failed IDL fetch', () => {
        expect(renderIntentSupport({ error: new Error('502'), isLoading: true })).toEqual({ status: 'failed' });
    });

    it('should report the supported root when the IDL has intent templates', () => {
        expect(renderIntentSupport({ isLoading: false, programMetadataIdl: SYSTEM_ROOT })).toEqual({
            root: SYSTEM_ROOT,
            status: 'supported',
        });
    });
});
