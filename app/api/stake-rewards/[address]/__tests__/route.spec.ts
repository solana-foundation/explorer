import { SignatureHistoryUnavailableError } from '@entities/stake-rewards/server';
import {
    makeStakeAccount,
    makeUndelegatedStakeAccount,
    makeUnparsedAccount,
    STAKE_ACCOUNT_ADDRESS,
} from '@features/stake/__fixtures__/stake-account';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const mocks = vi.hoisted(() => ({
    getAccountInfo: vi.fn(),
    getEpochInfo: vi.fn(),
    getOldestSignatureSlot: vi.fn(),
    sumInflationRewards: vi.fn(),
}));

// The sweep and the epoch-range rule have their own specs. This one covers the transport edge:
// param parsing, the not-a-stake-account guard, response shaping, cache headers, and the
// error-to-HTTP policy.
vi.mock('@entities/stake-rewards/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/stake-rewards/server')>(
        '@entities/stake-rewards/server',
    );
    return {
        ...actual,
        getOldestSignatureSlot: mocks.getOldestSignatureSlot,
        sumInflationRewards: mocks.sumInflationRewards,
    };
});

// Only `createSolanaRpc` is replaced. `address()` stays real, so the invalid-address case still
// exercises the route's own guard rather than a mock's.
vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: () => ({
            getAccountInfo: () => ({ send: mocks.getAccountInfo }),
            getEpochInfo: () => ({ send: mocks.getEpochInfo }),
        }),
    };
});

describe('GET /api/stake-rewards/[address]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        mocks.getEpochInfo.mockResolvedValue(EPOCH_INFO);
        mocks.getAccountInfo.mockResolvedValue({ value: makeStakeAccount() });
        // Created in epoch 943, the epoch it was also delegated in.
        mocks.getOldestSignatureSlot.mockResolvedValue(407_506_361n);
        mocks.sumInflationRewards.mockResolvedValue(4200824);
    });

    it('should return the total with its epoch range and CDN cache headers', async () => {
        const response = await callRoute();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ fromEpoch: 943, toEpoch: 1011, totalReward: 4200824 });
        expect(response.headers.get('Cache-Control')).toContain('s-maxage=14400');
    });

    it('should sweep only the account own epoch range', async () => {
        await callRoute();

        expect(mocks.sumInflationRewards).toHaveBeenCalledWith(
            expect.objectContaining({ range: { fromEpoch: 943, toEpoch: 1011 } }),
        );
    });

    it('should start the sweep at the creation epoch when the account has been re-delegated', async () => {
        // The shape measured on `MCrWxQJgT3VogbgM5sy78K4uCEmwPQiKeXG2Bna51zs`: delegated in 1005,
        // but created in slot 364,763,481, which is epoch 844. Sweeping from 1005 would have
        // reported 10,482,997 lamports of the 55,208,535 the account actually earned.
        mocks.getAccountInfo.mockResolvedValue({ value: makeStakeAccount({ activationEpoch: '1005' }) });
        mocks.getOldestSignatureSlot.mockResolvedValue(364_763_481n);

        await callRoute();

        expect(mocks.sumInflationRewards).toHaveBeenCalledWith(
            expect.objectContaining({ range: { fromEpoch: 844, toEpoch: 1011 } }),
        );
    });

    it('should return an uncached 502 rather than a short total when the account cannot be dated', async () => {
        mocks.getOldestSignatureSlot.mockRejectedValue(new SignatureHistoryUnavailableError('too many signatures'));

        const response = await callRoute();

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Cannot determine account creation epoch' });
        expect(response.headers.get('Cache-Control')).toBeNull();
    });

    it('should not sweep any epoch when the account cannot be dated', async () => {
        mocks.getOldestSignatureSlot.mockRejectedValue(new SignatureHistoryUnavailableError('too many signatures'));

        await callRoute();

        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
        expect(Logger.warn).toHaveBeenCalledWith(
            '[api:stake-rewards] Could not date the account from its signature history',
            expect.objectContaining({ reason: 'too many signatures' }),
        );
    });

    it('should fail rather than fall back to a short total when the signature lookup fails', async () => {
        mocks.getOldestSignatureSlot.mockRejectedValue(new Error('rpc down'));

        expect((await callRoute()).status).toBe(502);
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should stop the range at the deactivation epoch', async () => {
        mocks.getAccountInfo.mockResolvedValue({ value: makeStakeAccount({ deactivationEpoch: '1000' }) });

        await callRoute();

        expect(mocks.sumInflationRewards).toHaveBeenCalledWith(
            expect.objectContaining({ range: { fromEpoch: 943, toEpoch: 1000 } }),
        );
    });

    it('should return zero without sweeping when the account has no completed epochs', async () => {
        mocks.getAccountInfo.mockResolvedValue({ value: makeStakeAccount({ activationEpoch: '1012' }) });
        // Created in epoch 1012 as well — a brand new account, delegated on the spot.
        mocks.getOldestSignatureSlot.mockResolvedValue(437_200_000n);

        const response = await callRoute();

        expect(await response.json()).toEqual({ totalReward: 0 });
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should still sweep an older account delegated this epoch, which may have earned before', async () => {
        // Delegated this epoch but created in 943, so an earlier delegation could have paid it.
        // Bounding this by `activationEpoch` is exactly the case that reported a short total.
        mocks.getAccountInfo.mockResolvedValue({ value: makeStakeAccount({ activationEpoch: '1012' }) });

        await callRoute();

        expect(mocks.sumInflationRewards).toHaveBeenCalledWith(
            expect.objectContaining({ range: { fromEpoch: 943, toEpoch: 1011 } }),
        );
    });

    it('should return 400 when the cluster param is missing', async () => {
        expect((await callRoute({ omitCluster: true })).status).toBe(400);
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should return 400 when the cluster param is not a known cluster', async () => {
        expect((await callRoute({ cluster: '99' })).status).toBe(400);
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should return 400 when the address is not valid base58', async () => {
        expect((await callRoute({ address: 'not-an-address' })).status).toBe(400);
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should return 404 when the account does not exist', async () => {
        mocks.getAccountInfo.mockResolvedValue(MISSING_ACCOUNT);

        const response = await callRoute();

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Account not found' });
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should return 400 when the address is not a stake account', async () => {
        mocks.getAccountInfo.mockResolvedValue({ value: makeUnparsedAccount() });

        const response = await callRoute();

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Not a stake account' });
    });

    it('should tell an undelegated stake account apart from a missing one', async () => {
        mocks.getAccountInfo.mockResolvedValue({ value: makeUndelegatedStakeAccount() });

        const response = await callRoute();

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Stake account has never been delegated' });
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should not cache a client error', async () => {
        mocks.getAccountInfo.mockResolvedValue(MISSING_ACCOUNT);

        expect((await callRoute()).headers.get('Cache-Control')).toBeNull();
    });

    it('should return an uncached 502 when the sweep fails', async () => {
        mocks.sumInflationRewards.mockRejectedValue(new Error('rpc down'));

        const response = await callRoute();

        expect(response.status).toBe(502);
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should not return a partial total when the sweep fails', async () => {
        mocks.sumInflationRewards.mockRejectedValue(new Error('rpc down'));

        expect(await (await callRoute()).json()).not.toHaveProperty('totalReward');
    });

    it('should bound the RPC calls that precede the sweep with a timeout', async () => {
        await callRoute();

        const boundedCall = expect.objectContaining({ abortSignal: expect.any(AbortSignal) });
        expect(mocks.getEpochInfo).toHaveBeenCalledWith(boundedCall);
        expect(mocks.getAccountInfo).toHaveBeenCalledWith(boundedCall);
    });

    it('should return 504 rather than 502 when the sweep times out', async () => {
        mocks.sumInflationRewards.mockRejectedValue(makeTimeoutError());

        const response = await callRoute();

        expect(response.status).toBe(504);
        expect(await response.json()).toEqual({ error: 'Upstream RPC timeout' });
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return 504 when an RPC call before the sweep times out', async () => {
        mocks.getAccountInfo.mockRejectedValue(makeTimeoutError());

        expect((await callRoute()).status).toBe(504);
        expect(mocks.sumInflationRewards).not.toHaveBeenCalled();
    });

    it('should report a timeout to Sentry with the range it was sweeping', async () => {
        mocks.sumInflationRewards.mockRejectedValue(makeTimeoutError());

        await callRoute();

        expect(Logger.warn).toHaveBeenCalledWith(
            // A static message, so every timeout groups into one Sentry issue.
            '[api:stake-rewards] Timed out resolving total reward',
            expect.objectContaining({
                sentry: true,
                // Only `sentryExtras` reaches Sentry, so the diagnostics must live there.
                sentryExtras: expect.objectContaining({
                    address: STAKE_ACCOUNT_ADDRESS,
                    cluster: String(Cluster.MainnetBeta),
                    epochCount: 69,
                    fromEpoch: 943,
                    phase: 'sweep',
                    toEpoch: 1011,
                }),
            }),
        );
    });

    it('should report which phase timed out when the sweep never started', async () => {
        mocks.getAccountInfo.mockRejectedValue(makeTimeoutError());

        await callRoute();

        expect(Logger.warn).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ phase: 'account-lookup' }),
            }),
        );
    });

    it('should not report an ordinary RPC failure to Sentry, which would only add noise', async () => {
        mocks.sumInflationRewards.mockRejectedValue(new Error('rpc down'));

        await callRoute();

        expect(Logger.warn).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ sentry: true }));
    });

    it('should not cache a timeout, so a retry can resume the sweep', async () => {
        mocks.sumInflationRewards.mockRejectedValue(makeTimeoutError());

        expect((await callRoute()).headers.get('Cache-Control')).toBeNull();
    });
});

/** What `AbortSignal.timeout` rejects with, which the route maps to a 504. */
function makeTimeoutError(): DOMException {
    return new DOMException('The operation timed out', 'TimeoutError');
}

/** kit returns `value: null` for an address with no account. */
const MISSING_ACCOUNT = { value: null };

/** `getEpochInfo` partway through epoch 1012, which starts at slot 437,184,000. */
const EPOCH_INFO = {
    absoluteSlot: 437_284_000n,
    epoch: 1012n,
    slotIndex: 100_000n,
    slotsInEpoch: 432_000n,
};

async function callRoute({
    address = STAKE_ACCOUNT_ADDRESS,
    cluster = String(Cluster.MainnetBeta),
    omitCluster = false,
}: { address?: string; cluster?: string; omitCluster?: boolean } = {}) {
    const { GET } = await import('../route');
    // An explicit flag, not `cluster: undefined` — a destructuring default fires on undefined.
    const query = omitCluster ? '' : `?cluster=${cluster}`;
    return GET(new Request(`https://explorer.test/api/stake-rewards/${address}${query}`), {
        params: Promise.resolve({ address }),
    });
}
