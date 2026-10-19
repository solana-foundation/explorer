import { type AnchorIdl, type CodamaIdl, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type Account } from '@/app/providers/accounts';

import { AnchorAccountCard } from '../AnchorAccountCard';

const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useProgramIdls: () => idlState,
}));

const AMM_CONFIG_DISCRIMINATOR = [218, 244, 33, 104, 203, 203, 43, 111];
const PMP_ANCHOR_IDL = {
    ...anchorModernIdl,
    metadata: { ...anchorModernIdl.metadata, name: 'pmp_program' },
} as unknown as AnchorIdl;
const ANCHOR_ACCOUNT_IDL = {
    ...anchorModernIdl,
    metadata: { ...anchorModernIdl.metadata, name: 'anchor_program' },
} as unknown as AnchorIdl;
const CUSTOM_ANCHOR_IDL = {
    ...anchorModernIdl,
    metadata: { ...anchorModernIdl.metadata, name: 'custom_program' },
} as unknown as AnchorIdl;
const CODAMA_IDL = { kind: 'rootNode', standard: 'codama' } as unknown as CodamaIdl;

const ACCOUNT: Account = {
    data: { raw: Uint8Array.from([...AMM_CONFIG_DISCRIMINATOR, ...new Array(200).fill(0)]) },
    executable: false,
    lamports: 1,
    owner: new PublicKey(anchorModernIdl.address),
    pubkey: PublicKey.default,
};

describe('AnchorAccountCard', () => {
    it('should decode with an Anchor-standard PMP IDL before the Anchor IDL account', () => {
        idlState.candidates = [
            { address: undefined, idl: PMP_ANCHOR_IDL, source: 'programMetadata', standard: 'Anchor' },
            { address: undefined, idl: ANCHOR_ACCOUNT_IDL, source: 'anchor', standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('PmpProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should decode with the Anchor IDL account when the PMP IDL is Codama', () => {
        idlState.candidates = [
            { address: undefined, idl: CODAMA_IDL, source: 'programMetadata', standard: 'Codama' },
            { address: undefined, idl: ANCHOR_ACCOUNT_IDL, source: 'anchor', standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('AnchorProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should skip an Anchor-standard PMP IDL that declares no account types', () => {
        idlState.candidates = [
            {
                address: undefined,
                idl: { ...PMP_ANCHOR_IDL, accounts: [] },
                source: 'programMetadata',
                standard: 'Anchor',
            },
            { address: undefined, idl: ANCHOR_ACCOUNT_IDL, source: 'anchor', standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('AnchorProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should decode with the selected custom Anchor IDL', () => {
        idlState.candidates = [
            { idl: CUSTOM_ANCHOR_IDL, origin: { kind: 'pasted' }, source: 'custom', standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('CustomProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should report a failed decode under the selected custom IDL', () => {
        idlState.candidates = [
            { idl: CUSTOM_ANCHOR_IDL, origin: { kind: 'pasted' }, source: 'custom', standard: 'Anchor' },
        ];
        const account = { ...ACCOUNT, data: { raw: new Uint8Array(208) } };

        render(<AnchorAccountCard account={account} />);

        expect(screen.getByText('Failed to decode account data according to the Anchor interface')).toBeInTheDocument();
    });

    it('should report no Anchor IDL when the selected custom IDL is Codama', () => {
        idlState.candidates = [{ idl: CODAMA_IDL, origin: { kind: 'pasted' }, source: 'custom', standard: 'Codama' }];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('No Anchor IDL found')).toBeInTheDocument();
    });

    it('should show the loading card, not a decode, while the IDLs load', () => {
        idlState.candidates = undefined;

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('Loading program IDL')).toBeInTheDocument();
        expect(screen.queryByText('AnchorProgram: AmmConfig')).not.toBeInTheDocument();
    });
});
