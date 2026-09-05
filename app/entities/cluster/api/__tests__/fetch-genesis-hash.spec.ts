import { createSolanaRpc } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@solana/kit', () => ({ createSolanaRpc: vi.fn() }));

import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { fetchGenesisHash } from '../fetch-genesis-hash';

const GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

describe('fetchGenesisHash', () => {
    const send = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        send.mockResolvedValue(GENESIS_HASH);
        vi.mocked(createSolanaRpc).mockReturnValue({ getGenesisHash: () => ({ send }) } as unknown as ReturnType<
            typeof createSolanaRpc
        >);
    });

    // The deadline test below spies on a global; left in place it would outlive this file.
    afterEach(() => vi.restoreAllMocks());

    it('should resolve the chain identity', async () => {
        await expect(fetchGenesisHash('https://api.mainnet-beta.solana.com')).resolves.toBe(GENESIS_HASH);
    });

    // The cluster status waits on this call, and every hook keyed on that status waits with it, so a node
    // that accepts the connection and never answers has to fail rather than hold the tree at loading. The
    // value is pinned too: a deadline long enough is the same as none to a visitor watching the card.
    it('should carry a deadline', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await fetchGenesisHash('https://api.mainnet-beta.solana.com');

        expect(send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });
});
