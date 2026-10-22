import { type AnchorIdl, type CodamaIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import referenceIdl from '@entities/idl/mocks/anchor/reference-0.29.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDataTab } from '../AccountDataTab';

const idlState: ProgramIdls = { idls: [] };
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'mainnet-beta', url: 'http://localhost' }) }));
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({
    useProgramIdls: (...args: unknown[]) => useProgramIdls(...args),
}));
vi.mock('@/app/shared/ui/navigation-tabs', () => ({
    NavigationTabLink: ({ title }: { title: string }) => <span>{title}</span>,
}));

const ANCHOR_WITH_ACCOUNTS = anchorModernIdl as unknown as AnchorIdl;
const ANCHOR_WITHOUT_ACCOUNTS = { ...anchorModernIdl, accounts: [] } as unknown as AnchorIdl;
const ANCHOR_WITHOUT_PROGRAM = referenceIdl as unknown as AnchorIdl;
const CODAMA = codamaIdl as unknown as CodamaIdl;

const renderTab = () => render(<AccountDataTab programId={new PublicKey(anchorModernIdl.address)} />);

describe('AccountDataTab', () => {
    beforeEach(() => {
        idlState.idls = [];
        useProgramIdls.mockClear();
    });

    it('should read the IDLs of the program', () => {
        renderTab();
        expect(useProgramIdls).toHaveBeenCalledWith(anchorModernIdl.address, 'http://localhost', 'mainnet-beta');
    });

    it('should show the Anchor Data tab when an Anchor-standard IDL declares account types', () => {
        idlState.idls = [
            { idl: CODAMA, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
            { idl: ANCHOR_WITH_ACCOUNTS, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should show the Anchor Data tab when an Anchor-standard PMP IDL declares account types', () => {
        idlState.idls = [
            {
                idl: ANCHOR_WITH_ACCOUNTS,
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
        ];
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should use the Anchor IDL account when the PMP IDL does not build a program', () => {
        idlState.idls = [
            {
                idl: ANCHOR_WITHOUT_PROGRAM,
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
            { idl: ANCHOR_WITH_ACCOUNTS, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should hide the tab when the program has no IDL', () => {
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when the Anchor-standard IDL declares no account types', () => {
        idlState.idls = [
            {
                idl: ANCHOR_WITHOUT_ACCOUNTS,
                idlAddress: undefined,
                source: IdlVariant.ProgramMetadata,
                standard: 'Anchor',
            },
        ];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when the Anchor-standard IDL with account types does not build a program', () => {
        idlState.idls = [
            { idl: ANCHOR_WITHOUT_PROGRAM, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when the only IDL is Codama', () => {
        idlState.idls = [
            { idl: CODAMA, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
        ];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab while the IDLs load', () => {
        idlState.idls = undefined;
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });
});
