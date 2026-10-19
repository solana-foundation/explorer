import { type AnchorIdl, type CodamaIdl, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import referenceIdl from '@entities/idl/mocks/anchor/reference-0.29.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDataTab } from '../AccountDataTab';

const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'mainnet-beta', url: 'http://localhost' }) }));
vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useProgramIdls: () => idlState,
}));
vi.mock('@/app/shared/ui/navigation-tabs', () => ({
    NavigationTabLink: ({ title }: { title: string }) => <span>{title}</span>,
}));

const ANCHOR_WITH_ACCOUNTS = anchorModernIdl as unknown as AnchorIdl;
const ANCHOR_WITHOUT_ACCOUNTS = { ...anchorModernIdl, accounts: [] } as unknown as AnchorIdl;
const ANCHOR_WITHOUT_PROGRAM = referenceIdl as unknown as AnchorIdl;
const CODAMA = { kind: 'rootNode', standard: 'codama' } as unknown as CodamaIdl;

const renderTab = () => render(<AccountDataTab programId={new PublicKey(anchorModernIdl.address)} />);

describe('AccountDataTab', () => {
    beforeEach(() => {
        idlState.candidates = [];
    });

    it('should show the Anchor Data tab when an Anchor-standard candidate declares account types', () => {
        idlState.candidates = [
            { address: undefined, idl: CODAMA, source: 'programMetadata', standard: 'Codama' },
            { address: undefined, idl: ANCHOR_WITH_ACCOUNTS, source: 'anchor', standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should hide the tab when the program has no IDL', () => {
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when the Anchor-standard candidate has an empty accounts array', () => {
        idlState.candidates = [
            { address: undefined, idl: ANCHOR_WITHOUT_ACCOUNTS, source: 'programMetadata', standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when the Anchor-standard candidate with account types does not build a program', () => {
        idlState.candidates = [
            { address: undefined, idl: ANCHOR_WITHOUT_PROGRAM, source: 'anchor', standard: 'Anchor' },
        ];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when only a Codama candidate exists', () => {
        idlState.candidates = [{ address: undefined, idl: CODAMA, source: 'programMetadata', standard: 'Codama' }];
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab while the IDLs load', () => {
        idlState.candidates = undefined;
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });
});
