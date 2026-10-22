import { type AnchorIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { useSquadsMultisig } from '@/app/providers/squadsMultisig';

import { ProgramMultisigCard } from '../ProgramMultisigCard';

const idlState: ProgramIdls = { idls: [] };

vi.mock('@providers/cluster', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/cluster')>()),
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'http://localhost' }),
}));
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({ useProgramIdls: () => idlState }));
vi.mock('@/app/providers/squadsMultisig', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/squadsMultisig')>()),
    useSquadsMultisig: vi.fn(() => ({ data: undefined })),
    useSquadsMultisigLookup: () => ({ data: null }),
}));

const PROGRAM_DATA: UpgradeableLoaderAccountData = {
    parsed: { info: { programData: PublicKey.default }, type: 'program' },
    program: 'bpf-upgradeable-loader',
};

describe('ProgramMultisigCard', () => {
    beforeEach(() => {
        vi.mocked(useSquadsMultisig).mockClear();
    });

    it('should decode the multisig with the IDL from the Anchor IDL account over the PMP IDL', () => {
        idlState.idls = [
            {
                idl: namedIdl('pmp_program'),
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
            { idl: namedIdl('anchor_program'), idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        render(<ProgramMultisigCard data={PROGRAM_DATA} />);

        expect(vi.mocked(useSquadsMultisig).mock.lastCall?.[0]?.idl.metadata.name).toBe('anchorProgram');
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

        render(<ProgramMultisigCard data={PROGRAM_DATA} />);

        expect(vi.mocked(useSquadsMultisig).mock.lastCall?.[0]).toBeNull();
    });
});

function namedIdl(name: string): AnchorIdl {
    return { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name } } as unknown as AnchorIdl;
}
