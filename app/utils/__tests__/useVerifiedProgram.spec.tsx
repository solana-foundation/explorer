import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useVerifiedProgram } from '../verified-builds';

const VERIFY_PROGRAM_ID = 'verifycLy8mB96wd9wqq3WDXQwM4oU6r42Th37Db9fC';
const URL = 'https://api.mainnet-beta.solana.com';
const ON_CHAIN_IDL = { name: 'on_chain_verify' };
const CUSTOM_IDL = { name: 'custom_verify' };

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
                customIdl: { idl: CUSTOM_IDL, programAddress: VERIFY_PROGRAM_ID, standard: 'Anchor' },
                origin: { kind: 'pasted' },
                selected: 'custom',
            },
            status: 'ready',
        },
    }),
}));
vi.mock('../../providers/cluster', () => ({ useCluster: () => ({ cluster: 'mainnet-beta', url: URL }) }));
vi.mock('swr/immutable', () => ({ default: () => ({ data: undefined, isLoading: false }) }));

describe('useVerifiedProgram', () => {
    it('should read verification accounts with the on-chain IDL when a custom IDL is selected for the program', () => {
        renderHook(() => useVerifiedProgram({ programAuthority: null, programId: PublicKey.default }));

        expect(mocks.useAnchorProgram).toHaveBeenCalledWith(ON_CHAIN_IDL, VERIFY_PROGRAM_ID, URL);
    });
});
