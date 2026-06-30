import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDataTab } from '../AccountDataTab';

const useAnchorProgram = vi.fn();
const useProgramMetadataIdl = vi.fn();

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'mainnet-beta', url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({ useAnchorProgram: (...a: unknown[]) => useAnchorProgram(...a) }));
vi.mock('@/app/entities/program-metadata', () => ({
    useProgramMetadataIdl: (...a: unknown[]) => useProgramMetadataIdl(...a),
}));
vi.mock('@/app/shared/ui/navigation-tabs', () => ({
    NavigationTabLink: ({ title }: { title: string }) => <span>{title}</span>,
}));

const renderTab = () => render(<AccountDataTab programId={PublicKey.default} />);

describe('AccountDataTab', () => {
    beforeEach(() => {
        useAnchorProgram.mockReturnValue({ program: undefined });
        useProgramMetadataIdl.mockReturnValue({ programMetadataIdl: undefined });
    });

    it('should show the Anchor Data tab when a legacy Anchor program is available', () => {
        useAnchorProgram.mockReturnValue({ program: {} });
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should show the Anchor Data tab when the PMP IDL declares account types', () => {
        useProgramMetadataIdl.mockReturnValue({ programMetadataIdl: { accounts: [{ name: 'state' }] } });
        renderTab();
        expect(screen.getByText('Anchor Data')).toBeInTheDocument();
    });

    it('should hide the tab when the PMP IDL has an empty accounts array', () => {
        useProgramMetadataIdl.mockReturnValue({ programMetadataIdl: { accounts: [] } });
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });

    it('should hide the tab when there is no Anchor program and no PMP IDL', () => {
        renderTab();
        expect(screen.queryByText('Anchor Data')).not.toBeInTheDocument();
    });
});
