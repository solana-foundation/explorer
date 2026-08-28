import { lamports } from '@solana/kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StakingSection } from '../StakingSection';

const { useSupply, useVoteAccounts } = vi.hoisted(() => ({
    useSupply: vi.fn(),
    useVoteAccounts: vi.fn(),
}));
vi.mock('@features/supply', () => ({ useSupply }));
vi.mock('@features/vote/model/vote-accounts', () => ({ useVoteAccounts }));

const SUPPLY = { circulating: lamports(400_000_000_000_000_000n), total: lamports(500_000_000_000_000_000n) };
const STAKE = { active: 300_000_000_000_000_000n, delinquent: 30_000_000_000_000_000n };

beforeEach(() => {
    vi.clearAllMocks();
    useSupply.mockReturnValue({ kind: 'ready', supply: SUPPLY });
    useVoteAccounts.mockReturnValue({ kind: 'ready', stake: STAKE });
});

describe('StakingSection', () => {
    // Read off `textContent`: both cards render the total, so a by-text query is ambiguous.
    it('should report circulating supply as a share of the total', () => {
        const { container } = render(<StakingSection />);

        expect(screen.getByText('Circulating Supply')).toBeInTheDocument();
        // Lamports in, SOL on screen, abbreviated by `abbreviatedNumber`.
        expect(container.textContent).toContain('400M / 500M');
        expect(container.textContent).toContain('80.0% is circulating');
    });

    it('should report active stake against the total supply', () => {
        const { container } = render(<StakingSection />);

        expect(screen.getByText('Active Stake')).toBeInTheDocument();
        expect(container.textContent).toContain('300M / 500M');
        expect(container.textContent).toContain('Delinquent stake: 10.0%');
    });

    // The ordinary case on a healthy cluster, and hiding it would leave "none" and "unknown" alike.
    it('should report zero delinquent stake rather than dropping the row', () => {
        useVoteAccounts.mockReturnValue({ kind: 'ready', stake: { active: STAKE.active, delinquent: 0n } });

        const { container } = render(<StakingSection />);

        expect(container.textContent).toContain('300M / 500M');
        expect(container.textContent).toContain('Delinquent stake: 0.0%');
    });

    it('should omit the delinquent share on a cluster with no activated stake, rather than divide by zero', () => {
        useVoteAccounts.mockReturnValue({ kind: 'ready', stake: { active: 0n, delinquent: 0n } });

        const { container } = render(<StakingSection />);

        expect(screen.getByText('Active Stake')).toBeInTheDocument();
        expect(container.textContent).not.toContain('Delinquent stake');
    });

    it('should wait for supply behind both skeletons, since neither card has a figure yet', () => {
        useSupply.mockReturnValue({ kind: 'loading' });
        useVoteAccounts.mockReturnValue({ kind: 'loading' });

        render(<StakingSection />);

        expect(screen.getByText('Loading supply data')).toBeInTheDocument();
        expect(screen.getByText('Loading staking data')).toBeInTheDocument();
    });

    it('should offer one retry when supply failed, because the staking card is not on screen', () => {
        const retry = vi.fn();
        useSupply.mockReturnValue({ kind: 'failed', retry });

        render(<StakingSection />);

        expect(screen.getByText('Failed to fetch supply')).toBeInTheDocument();
        expect(screen.queryByText('Active Stake')).not.toBeInTheDocument();
    });

    // Wired to the wrong hook, or to nothing at all, the button still renders and still does nothing.
    it('should ask supply again when the visitor presses its retry', async () => {
        const retry = vi.fn();
        useSupply.mockReturnValue({ kind: 'failed', retry });

        render(<StakingSection />);
        await userEvent.click(screen.getAllByText('Try Again')[0]);

        expect(retry).toHaveBeenCalledOnce();
    });

    it('should ask staking data again when the visitor presses its retry', async () => {
        const retry = vi.fn();
        useVoteAccounts.mockReturnValue({ kind: 'failed', retry });

        render(<StakingSection />);
        await userEvent.click(screen.getAllByText('Try Again')[0]);

        expect(retry).toHaveBeenCalledOnce();
    });

    // A failure the state says will repeat: a button here would re-ask a question already answered.
    it('should offer no retry where supply is unavailable', () => {
        useSupply.mockReturnValue({ kind: 'unavailable' });

        render(<StakingSection />);

        expect(screen.getByText('Supply is unavailable for this cluster')).toBeInTheDocument();
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    // Supply can be answered from the CDN, so it lands before stake does.
    it('should keep the supply card while staking data is still on its way', () => {
        useVoteAccounts.mockReturnValue({ kind: 'loading' });

        render(<StakingSection />);

        expect(screen.getByText('Circulating Supply')).toBeInTheDocument();
        expect(screen.getByText('Loading staking data')).toBeInTheDocument();
    });

    // Without a failed arm this spins forever.
    it('should end the staking wait with a retryable error when the request failed', () => {
        const retry = vi.fn();
        useVoteAccounts.mockReturnValue({ kind: 'failed', retry });

        render(<StakingSection />);

        expect(screen.getByText('Circulating Supply')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch staking data')).toBeInTheDocument();
        expect(screen.queryByText('Loading staking data')).not.toBeInTheDocument();
    });

    it('should render nothing on a cluster reporting no supply at all', () => {
        useSupply.mockReturnValue({ kind: 'ready', supply: { circulating: lamports(0n), total: lamports(0n) } });

        const { container } = render(<StakingSection />);

        expect(container).toBeEmptyDOMElement();
    });
});
