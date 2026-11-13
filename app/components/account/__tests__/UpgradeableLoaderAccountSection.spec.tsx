import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type Account } from '@/app/providers/accounts';
import { useSquadsMultisigLookup } from '@/app/providers/squadsMultisig';
import { Cluster } from '@/app/utils/cluster';

import { UpgradeableProgramSection } from '../UpgradeableLoaderAccountSection';

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta }) }));
vi.mock('@entities/account', () => ({ useRefreshAccount: () => vi.fn() }));
vi.mock('@features/account', () => ({
    AccountCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@components/common/Address', () => ({ Address: () => null }));
vi.mock('@components/common/Slot', () => ({ Slot: () => null }));
vi.mock('@components/common/VerifiedProgramBadge', () => ({ VerifiedProgramBadge: () => null }));
vi.mock('@/app/features/security-txt/ui/SecurityTXTBadge', () => ({ ProgramSecurityTXTBadge: () => null }));
vi.mock('@/app/utils/url', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/utils/url')>()),
    useClusterPath: ({ pathname }: { pathname: string }) => pathname,
}));
vi.mock('@/app/providers/squadsMultisig', () => ({ useSquadsMultisigLookup: vi.fn() }));

const PROGRAM = PublicKey.unique();

describe('UpgradeableProgramSection', () => {
    it('should render the program card while the Squads lookup is pending', () => {
        vi.mocked(useSquadsMultisigLookup).mockImplementation(() => {
            throw new Promise(() => {});
        });

        renderProgramSection();

        expect(screen.getByText('Upgrade Authority')).toBeInTheDocument();
    });

    it('should link to the Program Multisig tab when a Squads multisig holds the upgrade authority', () => {
        vi.mocked(useSquadsMultisigLookup).mockReturnValue({
            data: { isSquad: true, multisig: PublicKey.unique().toBase58(), version: 'v4' },
        } as ReturnType<typeof useSquadsMultisigLookup>);

        renderProgramSection();

        expect(screen.getByRole('link', { name: 'Program Multisig' })).toHaveAttribute(
            'href',
            `/address/${PROGRAM.toBase58()}/program-multisig`,
        );
    });
});

function renderProgramSection(): void {
    const account: Account = {
        data: {},
        executable: true,
        lamports: 1,
        owner: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
        pubkey: PROGRAM,
        space: 36,
    };
    render(
        <UpgradeableProgramSection
            account={account}
            programAccount={{ programData: PublicKey.unique() }}
            programData={{ authority: PublicKey.unique(), data: ['', 'base64'], slot: 1 }}
        />,
    );
}
