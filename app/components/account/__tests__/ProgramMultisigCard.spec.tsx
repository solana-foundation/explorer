import { PublicKey } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { SQUADS_V4_ADDRESS } from '@/app/providers/squadsMultisig';

import { ProgramMultisigCard } from '../ProgramMultisigCard';

const ON_CHAIN_IDL = { name: 'on_chain_squads' };
const CUSTOM_IDL = { name: 'custom_squads' };

const mocks = vi.hoisted(() => ({ useAnchorProgram: vi.fn(() => null) }));

vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useAnchorProgram: mocks.useAnchorProgram,
    useProgramIdls: () => ({
        candidates: [{ idl: CUSTOM_IDL, origin: { kind: 'pasted' }, source: 'custom', standard: 'Anchor' }],
        isOnChainLoading: false,
        onChain: { anchorIdl: ON_CHAIN_IDL },
        stored: {
            record: {
                customIdl: { idl: CUSTOM_IDL, programAddress: SQUADS_V4_ADDRESS, standard: 'Anchor' },
                origin: { kind: 'pasted' },
                selected: 'custom',
            },
            status: 'ready',
        },
    }),
}));
vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({ cluster: 'mainnet-beta', url: 'http://localhost' }),
}));
vi.mock('@/app/providers/squadsMultisig', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/squadsMultisig')>()),
    useSquadsMultisig: () => ({ data: undefined }),
    useSquadsMultisigLookup: () => ({
        data: { isSquad: false, multisig: PublicKey.default.toBase58(), version: 'v4' },
    }),
}));

describe('ProgramMultisigCard', () => {
    it('should decode the multisig with the on-chain Squads IDL when a custom IDL is selected for Squads', () => {
        const data = { programData: { authority: PublicKey.default } } as unknown as UpgradeableLoaderAccountData;

        render(<ProgramMultisigCard data={data} />);

        expect(mocks.useAnchorProgram).toHaveBeenCalledWith(ON_CHAIN_IDL, SQUADS_V4_ADDRESS, 'http://localhost');
    });
});
