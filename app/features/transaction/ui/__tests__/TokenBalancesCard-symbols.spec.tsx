import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { PublicKey } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { BigNumber } from 'bignumber.js';

import { TokenBalancesCardInner } from '../TokenBalancesCard';

const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const WSOL = 'So11111111111111111111111111111111111111112';

const mocks = vi.hoisted(() => ({
    cluster: { cluster: 0, genesisHash: undefined as string | undefined },
    useTokenInfos: vi.fn(),
}));

vi.mock('@/app/providers/cluster', () => ({ useCluster: () => mocks.cluster }));
vi.mock('@entities/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info')>()),
    useTokenInfos: mocks.useTokenInfos,
}));
vi.mock('@/app/providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts/tokens')>()),
    useScaledUiAmountMultiplier: () => ({ multiplier: '1', status: 'known' }),
}));
vi.mock('@components/common/Address', () => ({ Address: () => <span>address</span> }));
vi.mock('@components/common/BalanceDelta', () => ({ BalanceDelta: () => <span>delta</span> }));
vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({ default: () => null }));

describe('TokenBalancesCard token symbols', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = { cluster: Cluster.Mainnet, genesisHash: undefined };
        mocks.useTokenInfos.mockReturnValue(resolved({}));
    });

    it('should request every mint in the card with the on-chain fallback', () => {
        mocks.cluster = { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET };

        render(<TokenBalancesCardInner rows={[row(USDC, '100'), row(WSOL, '2')]} />);

        expect(mocks.useTokenInfos).toHaveBeenCalledWith({
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
            includeOnChainFallback: true,
            mints: [USDC, WSOL],
        });
    });

    it('should show "tokens" for a mint without token info', () => {
        mocks.useTokenInfos.mockReturnValue(resolved({ [USDC]: 'USDC' }));

        const { container } = render(<TokenBalancesCardInner rows={[row(USDC, '100'), row(WSOL, '2')]} />);

        expect(container.textContent).toContain('100 USDC');
        expect(container.textContent).toContain('2 tokens');
    });
});

function row(mint: string, balance: string) {
    return { account: new PublicKey(mint), accountIndex: 0, balance, delta: new BigNumber(0), mint };
}

function resolved(symbolsByMint: Record<string, string>): {
    isLoading: boolean;
    tokenInfos: Map<string, { symbol: string }>;
} {
    const entries = Object.entries(symbolsByMint).map(([mint, symbol]) => [mint, { symbol }] as const);
    return { isLoading: false, tokenInfos: new Map(entries) };
}
