import { render, screen, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';

import { SquadsAccountSection, type SquadsAccountType } from '../SquadsAccountSection';
import { BATCH_DATA, makeSquadsAccount, VAULT_TRANSACTION_DATA } from './__fixtures__/squads-accounts';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));
vi.mock('@providers/cluster', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/cluster')>()),
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'http://localhost' }),
}));

describe('SquadsAccountSection', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should show the multisig and its vault for a vault transaction account', async () => {
        renderSection(VAULT_TRANSACTION_DATA, 'vaultTransaction');

        expect(await screen.findByText('Multisig Vault')).toBeInTheDocument();
        expect(rowOf('Multisig Account')).toHaveTextContent('BhxNKqwmF7MT5pWBterrwv7a5GVHFRCk4Y51y7QGeHV2');
        expect(rowOf('Multisig Vault')).toHaveTextContent('F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT');
    });

    it('should show the multisig and its vault for a batch account', async () => {
        renderSection(BATCH_DATA, 'batch');

        expect(await screen.findByText('Multisig Vault')).toBeInTheDocument();
        expect(rowOf('Multisig Account')).toHaveTextContent('BUqQwPmEZ8vormnD8PjfcFQh6pGwpyW1ohr26qfiMTGb');
        expect(rowOf('Multisig Vault')).toHaveTextContent('GhcyhaiSvr6Sd9FDp5Bpe4LT4ny4WqZfwZEvnFxAgMgE');
    });

    it('should hide the multisig rows when the account data cannot be decoded', async () => {
        const logError = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);

        renderSection(BATCH_DATA.subarray(0, 40), 'batch');

        await waitFor(() => expect(logError).toHaveBeenCalledTimes(1));
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.queryByText('Multisig Account')).not.toBeInTheDocument();
        expect(screen.queryByText('Multisig Vault')).not.toBeInTheDocument();
    });
});

function renderSection(raw: Uint8Array, accountType: SquadsAccountType) {
    return render(<SquadsAccountSection account={makeSquadsAccount(raw)} accountType={accountType} />, {
        wrapper: swrWrapper(),
    });
}

function rowOf(label: string): HTMLElement {
    return screen.getByText(
        (_, element) => element?.textContent?.startsWith(label) === true && element.textContent !== label,
    );
}
