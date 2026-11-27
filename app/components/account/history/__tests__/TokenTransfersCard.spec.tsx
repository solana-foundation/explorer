import { type TransactionWithMeta } from '@entities/transaction-data';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { TokenTransfersCard } from '../TokenTransfersCard';

const MINT = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';
const SOURCE = 'GsbwXfJraMomNxBcpR3DBr9yoWR2PmN93PEaYJz7MSTN';
const DESTINATION = '9noXzpXnkyEcKF3AeXqUHTdR59V5uvrRBUZ9bwfQwxNq';
const SIGNATURE = 'signature';

const mocks = vi.hoisted(() => ({ history: undefined as unknown }));

vi.mock('@providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts')>()),
    useAccountHistory: () => mocks.history,
}));
vi.mock('@features/transaction-history/model/use-fetch-account-history', () => ({
    useFetchAccountHistory: () => vi.fn(),
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.Mainnet, url: 'http://rpc' }) }));
vi.mock('@providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts/tokens')>()),
    useScaledUiAmountMultiplier: () => ({ multiplier: '1.007474126658766', status: 'known' }),
}));
vi.mock('@entities/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info')>()),
    fetchTokenInfoFromApi: () => Promise.resolve(undefined),
}));
vi.mock('@components/common/Address', () => ({ Address: () => <span>address</span> }));
vi.mock('@components/common/Signature', () => ({ Signature: () => <span>signature</span> }));
vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({ default: () => null }));
vi.mock('@/app/components/shared/ui/refresh-button', () => ({ RefreshButton: () => null }));

describe('TokenTransfersCard amounts', () => {
    it('should scale the amount of a transfer with the decimals of a token balance', async () => {
        mocks.history = toHistory({
            parsed: { info: { amount: '123450000000', destination: DESTINATION, source: SOURCE }, type: 'transfer' },
        });

        const { container } = render(<TokenTransfersCard address={MINT} />);

        await waitFor(() => expect(container.textContent).toContain('1243.72680936 Tokens'));
    });

    it('should scale the raw amount of a transferChecked, not the UI amount', async () => {
        mocks.history = toHistory({
            parsed: {
                info: {
                    destination: DESTINATION,
                    mint: MINT,
                    source: SOURCE,
                    tokenAmount: { amount: '250000000', decimals: 8, uiAmountString: '2.5' },
                },
                type: 'transferChecked',
            },
        });

        const { container } = render(<TokenTransfersCard address={MINT} />);

        await waitFor(() => expect(container.textContent).toContain('2.51868531 Tokens'));
    });
});

function toHistory(instruction: { parsed: unknown }) {
    const transactionWithMeta = {
        meta: {
            postTokenBalances: [{ accountIndex: 0, mint: MINT, uiTokenAmount: { amount: '0', decimals: 8 } }],
        },
        transaction: {
            message: {
                accountKeys: [{ pubkey: new PublicKey(SOURCE) }],
                instructions: [{ ...instruction, program: 'spl-token', programId: PublicKey.default }],
            },
        },
    } as unknown as TransactionWithMeta;

    return {
        data: {
            fetched: [{ blockTime: null, err: null, signature: SIGNATURE, slot: 1 }],
            foundOldest: true,
            transactionMap: new Map([[SIGNATURE, transactionWithMeta]]),
        },
        status: FetchStatus.Fetched,
    };
}
