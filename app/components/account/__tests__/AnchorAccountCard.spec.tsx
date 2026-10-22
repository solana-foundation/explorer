import { type AnchorIdl, type CodamaIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import referenceIdl from '@entities/idl/mocks/anchor/reference-0.29.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Account } from '@/app/providers/accounts';

import { AnchorAccountCard } from '../AnchorAccountCard';

const idlState: ProgramIdls = { idls: [] };
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({
    useProgramIdls: (...args: unknown[]) => useProgramIdls(...args),
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
const CODAMA_IDL = codamaIdl as unknown as CodamaIdl;
const UNBUILDABLE_IDL = referenceIdl as unknown as AnchorIdl;

const ACCOUNT: Account = {
    data: { raw: Uint8Array.from([...AMM_CONFIG_DISCRIMINATOR, ...new Array(200).fill(0)]) },
    executable: false,
    lamports: 1,
    owner: new PublicKey(anchorModernIdl.address),
    pubkey: PublicKey.default,
};

describe('AnchorAccountCard', () => {
    beforeEach(() => useProgramIdls.mockClear());

    it('should read the IDLs of the owner program', () => {
        idlState.idls = [];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(useProgramIdls).toHaveBeenCalledWith(ACCOUNT.owner.toString(), 'http://localhost', 'devnet');
    });

    it('should decode with an Anchor-standard PMP IDL over the Anchor IDL account', () => {
        idlState.idls = [
            { idl: PMP_ANCHOR_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' },
            { idl: ANCHOR_ACCOUNT_IDL, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('PmpProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should decode with the IDL from the Anchor IDL account when the PMP IDL is Codama', () => {
        idlState.idls = [
            { idl: CODAMA_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
            { idl: ANCHOR_ACCOUNT_IDL, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('AnchorProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should skip an Anchor-standard PMP IDL that declares no account types', () => {
        idlState.idls = [
            {
                idl: { ...PMP_ANCHOR_IDL, accounts: [] },
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
            { idl: ANCHOR_ACCOUNT_IDL, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('AnchorProgram: AmmConfig')).toBeInTheDocument();
    });

    it('should decode with the IDL from the Anchor IDL account when the PMP IDL does not build a program', () => {
        idlState.idls = [
            { idl: UNBUILDABLE_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' },
            { idl: ANCHOR_ACCOUNT_IDL, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('AnchorProgram: AmmConfig')).toBeInTheDocument();
    });

    it.each([
        ['declares no account types', { ...ANCHOR_ACCOUNT_IDL, accounts: [] }],
        ['does not build a program', UNBUILDABLE_IDL],
    ])('should show the decode error when the only Anchor IDL %s', (_, idl) => {
        idlState.idls = [{ idl, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' }];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(
            screen.getByText('Failed to decode account data according to the public Anchor interface'),
        ).toBeInTheDocument();
    });

    it('should show "No Anchor IDL found" when the only IDL is Codama', () => {
        idlState.idls = [
            { idl: CODAMA_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
        ];

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('No Anchor IDL found')).toBeInTheDocument();
    });

    it('should show the loading card while the IDLs load', () => {
        idlState.idls = undefined;

        render(<AnchorAccountCard account={ACCOUNT} />);

        expect(screen.getByText('Loading program IDL')).toBeInTheDocument();
    });
});
