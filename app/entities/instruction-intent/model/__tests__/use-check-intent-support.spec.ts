import { DEFAULT_RPC_URL } from '@__fixtures__/gen';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { programMetadataIdls, SYSTEM_PROGRAM_ADDRESS, SYSTEM_ROOT } from '../../mocks/fixtures';
import { useCheckIntentSupport } from '../use-check-intent-support';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

vi.mock('@entities/idl/@x/instruction-intent', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl/@x/instruction-intent')>()),
    useProgramIdls: mocks.useProgramIdls,
}));
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
        renderIntentSupport({ idls: undefined });

        expect(mocks.useProgramIdls).toHaveBeenCalledWith(SYSTEM_PROGRAM_ADDRESS, DEFAULT_RPC_URL, Cluster.Devnet);
    });

    it('should report loading when the IDL is loading', () => {
        expect(renderIntentSupport({ idls: undefined })).toEqual({ status: 'loading' });
    });

    it('should report failed when the IDL fetch fails', () => {
        expect(renderIntentSupport({ error: new Error('502'), idls: [] })).toEqual({ status: 'failed' });
    });

    it('should report failed when SWR retries a failed IDL fetch', () => {
        expect(renderIntentSupport({ error: new Error('502'), idls: undefined })).toEqual({ status: 'failed' });
    });

    it('should report the supported root when the IDL has intent templates', () => {
        expect(renderIntentSupport(programMetadataIdls(SYSTEM_ROOT))).toEqual({
            root: SYSTEM_ROOT,
            status: 'supported',
        });
    });

    it('should report none when the Program Metadata IDL is an Anchor IDL', () => {
        const anchorIdl = { address: SYSTEM_PROGRAM_ADDRESS, instructions: [], metadata: { name: 'x' } };

        expect(renderIntentSupport(programMetadataIdls(anchorIdl, 'Anchor'))).toEqual({ status: 'none' });
    });
});
