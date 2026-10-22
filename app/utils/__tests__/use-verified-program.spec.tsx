import { type AnchorIdl, IdlVariant, type ProgramIdls, useAnchorProgram } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVerifiedProgram } from '../verified-builds';

const idlState: ProgramIdls = { idls: [] };

// A cluster without an OSEC registry skips the registry fetch.
vi.mock('@providers/cluster', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/cluster')>()),
    useCluster: () => ({ cluster: Cluster.Testnet, url: 'http://localhost' }),
}));
vi.mock('@entities/idl', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/idl')>();
    return { ...actual, useAnchorProgram: vi.fn(actual.useAnchorProgram) };
});
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({ useProgramIdls: () => idlState }));

describe('useVerifiedProgram', () => {
    beforeEach(() => {
        vi.mocked(useAnchorProgram).mockClear();
    });

    it('should build the Program from the IDL in the Anchor IDL account over the PMP IDL', () => {
        idlState.idls = [
            {
                idl: namedIdl('pmp_program'),
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
            { idl: namedIdl('anchor_program'), idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        renderHook(() => useVerifiedProgram({ programAuthority: null, programId: PublicKey.default }));

        expect(vi.mocked(useAnchorProgram).mock.results.at(-1)?.value?.program?.idl.metadata.name).toBe(
            'anchorProgram',
        );
    });

    it('should build no Program when the only Anchor IDL is the PMP IDL', () => {
        idlState.idls = [
            {
                idl: namedIdl('pmp_program'),
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
        ];

        renderHook(() => useVerifiedProgram({ programAuthority: null, programId: PublicKey.default }));

        expect(vi.mocked(useAnchorProgram).mock.results.at(-1)?.value?.program).toBeNull();
    });
});

function namedIdl(name: string): AnchorIdl {
    return { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name } } as unknown as AnchorIdl;
}
