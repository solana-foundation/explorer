import { gen } from '@__fixtures__/gen';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sumInflationRewards } from '../sum-inflation-rewards';

describe('sumInflationRewards', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('should sum the amounts across the range', async () => {
        vi.mocked(global.fetch)
            .mockResolvedValueOnce(makeRewardResponse(10))
            .mockResolvedValueOnce(makeRewardResponse(20))
            .mockResolvedValueOnce(makeRewardResponse(30));

        expect(await sumInflationRewards(makeSweepArgs())).toBe(60);
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should count an epoch that paid no reward as zero', async () => {
        vi.mocked(global.fetch)
            .mockResolvedValueOnce(makeRewardResponse(10))
            .mockResolvedValueOnce(makeRewardResponse(undefined))
            .mockResolvedValueOnce(makeRewardResponse(30));

        expect(await sumInflationRewards(makeSweepArgs())).toBe(40);
    });

    it('should POST, since a JSON-RPC call carries a body', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));

        await sumInflationRewards(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }));

        expect(initForEpoch(1).method).toBe('POST');
    });

    it('should request one epoch per call, covering the whole range', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));

        await sumInflationRewards(makeSweepArgs({ range: { fromEpoch: 5, toEpoch: 7 } }));

        expect(requestedEpochs()).toEqual([5, 6, 7]);
    });

    it('should cache settled epochs with no expiry', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));

        await sumInflationRewards(makeSweepArgs());

        expect(initForEpoch(1).cache).toBe('force-cache');
        expect(initForEpoch(1).next).toEqual({ revalidate: false });
    });

    it('should not cache the newest epoch, which may not have settled', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));

        await sumInflationRewards(makeSweepArgs());

        expect(initForEpoch(3).cache).toBe('no-store');
        expect(initForEpoch(3).next).toBeUndefined();
    });

    it('should send a deterministic id so the body stays a stable cache key', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));
        const args = makeSweepArgs({ range: { fromEpoch: 9, toEpoch: 9 } });

        await sumInflationRewards(args);
        await sumInflationRewards(args);

        expect(requestBody(0)).toEqual(requestBody(1));
    });

    it('should bound every request with an abort signal', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRewardResponse(1));

        await sumInflationRewards(makeSweepArgs());

        // Without a signal a hung socket is neither a success nor a failure, so it could never be
        // retried. Each request carries one, and it must not be aborted up front.
        for (const epoch of [1, 2, 3]) {
            expect(initForEpoch(epoch).signal).toBeInstanceOf(AbortSignal);
            expect(initForEpoch(epoch).signal?.aborted).toBe(false);
        }
    });

    it('should retry an epoch whose request timed out', async () => {
        vi.mocked(global.fetch).mockRejectedValueOnce(makeTimeoutError()).mockResolvedValueOnce(makeRewardResponse(7));

        expect(await sumInflationRewards(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }))).toBe(7);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should surface a timeout as a TimeoutError, so the caller can tell it from an RPC fault', async () => {
        vi.mocked(global.fetch).mockRejectedValue(makeTimeoutError());

        await expectSweepToReject(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }), 'timed out');
    });

    it('should throw when an epoch returns a JSON-RPC error', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeRpcErrorResponse('boom'));

        await expectSweepToReject(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }), 'boom');
    });

    it('should throw when an epoch returns a non-ok response', async () => {
        vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 429 } as Response);

        await expectSweepToReject(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }), 'HTTP 429');
    });

    it('should retry a failing epoch before giving up', async () => {
        vi.mocked(global.fetch)
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce(makeRewardResponse(42));

        expect(await sumInflationRewards(makeSweepArgs({ range: { fromEpoch: 1, toEpoch: 1 } }))).toBe(42);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail the whole sweep when one epoch fails, rather than return a partial total', async () => {
        vi.mocked(global.fetch).mockImplementation((_url, init) =>
            epochOf(init) === 2 ? Promise.reject(new Error('epoch 2 down')) : Promise.resolve(makeRewardResponse(10)),
        );

        await expectSweepToReject(makeSweepArgs(), 'epoch 2 down');
    });
});

const ADDRESS = gen.vanityAddress('STAKE');
const RPC_URL = 'https://rpc.example';

type SweepArgs = Parameters<typeof sumInflationRewards>[0];

/** A three-epoch sweep, so epochs 1 and 2 are settled and epoch 3 is the newest. */
function makeSweepArgs(overrides: Partial<SweepArgs> = {}): SweepArgs {
    return {
        address: ADDRESS,
        range: { fromEpoch: 1, toEpoch: 3 },
        url: RPC_URL,
        ...overrides,
    };
}

/** An `amount` of `undefined` models an epoch that paid this account nothing. */
function makeRewardResponse(amount: number | undefined): Response {
    const reward = amount === undefined ? null : { amount };
    return {
        json: () => Promise.resolve({ id: 1, jsonrpc: '2.0', result: [reward] }),
        ok: true,
    } as Response;
}

/** What `AbortSignal.timeout` rejects with, which `isTimeoutError` matches on. */
function makeTimeoutError(): DOMException {
    return new DOMException('The operation timed out', 'TimeoutError');
}

function makeRpcErrorResponse(message: string): Response {
    return {
        json: () => Promise.resolve({ error: { code: -32000, message }, id: 1, jsonrpc: '2.0' }),
        ok: true,
    } as Response;
}

function epochOf(init: RequestInit | undefined): number {
    return JSON.parse(init?.body as string).params[1].epoch;
}

function requestBody(call: number) {
    return JSON.parse(vi.mocked(global.fetch).mock.calls[call][1]?.body as string);
}

function requestedEpochs(): number[] {
    return vi
        .mocked(global.fetch)
        .mock.calls.map(([, init]) => epochOf(init))
        .sort((a, b) => a - b);
}

function initForEpoch(epoch: number): RequestInit {
    const call = vi.mocked(global.fetch).mock.calls.find(([, init]) => epochOf(init) === epoch);
    if (!call) {
        throw new Error(`no request was made for epoch ${epoch}`);
    }
    return call[1] as RequestInit;
}

/**
 * Drives the retry backoff with fake timers. A failing epoch retries with an escalating delay that
 * runs past the default test timeout, and the point of these tests is the outcome, not the wait.
 */
async function expectSweepToReject(args: SweepArgs, message: string) {
    vi.useFakeTimers();
    try {
        const rejection = expect(sumInflationRewards(args)).rejects.toThrow(message);
        await vi.runAllTimersAsync();
        await rejection;
    } finally {
        vi.useRealTimers();
    }
}
