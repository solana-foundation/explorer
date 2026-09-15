import { gen } from '@__fixtures__/gen';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

const mocks = vi.hoisted(() => ({ resolveProgramIdlNames: vi.fn() }));

vi.mock('@entities/idl/server', () => ({ resolveProgramIdlNames: mocks.resolveProgramIdlNames }));

import { getIdlNames } from '../get-idl-names';

const FIRST = gen.address(1);
const SECOND = gen.address(2);

const firstNames = { programName: 'Jupiter Aggregator V6', resolveInstructionName: () => 'Route' };

// The stage budget, mirrored rather than imported: the constant is private, same as `maxRetries: 1` below.
const IDL_FETCH_BUDGET_MS = 1_500;

describe('getIdlNames', () => {
    afterEach(() => {
        vi.resetAllMocks();
        vi.useRealTimers();
    });

    it('should resolve a duplicated program once', async () => {
        mocks.resolveProgramIdlNames.mockResolvedValue(firstNames);

        const names = await getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST, FIRST, FIRST] });

        expect(mocks.resolveProgramIdlNames).toHaveBeenCalledTimes(1);
        expect(names.get(FIRST)).toBe(firstNames);
    });

    it('should turn the cluster into a url once and hand it to the entity unchanged', async () => {
        await getIdlNames({ cluster: Cluster.Devnet, programIds: [FIRST, SECOND] });

        const url = serverClusterUrl(Cluster.Devnet);
        const options = expect.objectContaining({ abortSignal: expect.any(AbortSignal), maxRetries: 1 });
        expect(mocks.resolveProgramIdlNames).toHaveBeenCalledWith(url, FIRST, options);
        expect(mocks.resolveProgramIdlNames).toHaveBeenCalledWith(url, SECOND, options);
    });

    it('should resolve nothing for an empty program list', async () => {
        const names = await getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [] });

        expect(mocks.resolveProgramIdlNames).not.toHaveBeenCalled();
        expect(names).toEqual(new Map());
    });

    it('should keep the healthy program in the map when another rejects', async () => {
        mocks.resolveProgramIdlNames.mockImplementation((_url: string, programId: string) =>
            programId === SECOND ? Promise.reject(new Error('rpc unreachable')) : Promise.resolve(firstNames),
        );

        const names = await getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST, SECOND] });

        expect(names.get(FIRST)).toBe(firstNames);
        expect(names.has(SECOND)).toBe(false);
    });

    it('should log the failed program with its cluster, its cause, and no url', async () => {
        mocks.resolveProgramIdlNames.mockRejectedValue(new Error('rpc unreachable'));

        await getIdlNames({ cluster: Cluster.Devnet, programIds: [FIRST] });

        expect(Logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                cause: expect.objectContaining({ message: 'rpc unreachable' }),
                message: expect.stringContaining('IDL names unavailable'),
            }),
            { cluster: Cluster.Devnet, programId: FIRST },
        );
    });

    it('should leave the key absent when a program simply has no IDL', async () => {
        const names = await getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST] });

        expect(names.size).toBe(0);
    });

    it('should keep the program that answered in time and drop the one that outlived the budget', async () => {
        vi.useFakeTimers();
        // Never settles, standing in for a connection that hangs rather than fails.
        mocks.resolveProgramIdlNames.mockImplementation((_url: string, programId: string) =>
            programId === SECOND ? new Promise(() => {}) : Promise.resolve(firstNames),
        );

        const pending = getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST, SECOND] });
        await vi.advanceTimersByTimeAsync(IDL_FETCH_BUDGET_MS);

        const names = await pending;

        expect(names.get(FIRST)).toBe(firstNames);
        expect(names.has(SECOND)).toBe(false);
    });

    it('should abort the program that outlived the budget so its request stops costing a connection', async () => {
        vi.useFakeTimers();
        const signals: AbortSignal[] = [];
        mocks.resolveProgramIdlNames.mockImplementation((_url: string, _programId: string, options) => {
            signals.push(options.abortSignal);
            return new Promise(() => {});
        });

        const pending = getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST] });
        // While the budget holds, the request has to stay live.
        expect(signals[0]?.aborted).toBe(false);

        await vi.advanceTimersByTimeAsync(IDL_FETCH_BUDGET_MS);
        await pending;

        expect(signals[0]?.aborted).toBe(true);
    });

    it('should not report an aborted straggler as a failure', async () => {
        vi.useFakeTimers();
        // What an aborted `fetch` rejects with, so the catch sees the same error the real RPC would raise.
        mocks.resolveProgramIdlNames.mockImplementation(
            (_url: string, _programId: string, { abortSignal }: { abortSignal: AbortSignal }) =>
                new Promise((_resolve, reject) =>
                    abortSignal.addEventListener('abort', () => reject(abortSignal.reason)),
                ),
        );

        const pending = getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST] });
        await vi.advanceTimersByTimeAsync(IDL_FETCH_BUDGET_MS);
        await pending;
        // The rejection lands after the budget resolves the batch, so let its catch run before asserting.
        await vi.advanceTimersByTimeAsync(0);

        expect(Logger.error).not.toHaveBeenCalled();
        expect(Logger.debug).toHaveBeenCalledWith(expect.stringContaining('abandoned past the budget'), {
            cluster: Cluster.MainnetBeta,
            programId: FIRST,
        });
    });

    it('should clear the budget timer once every program has answered', async () => {
        vi.useFakeTimers();
        mocks.resolveProgramIdlNames.mockResolvedValue(firstNames);

        const names = await getIdlNames({ cluster: Cluster.MainnetBeta, programIds: [FIRST] });

        expect(names.get(FIRST)).toBe(firstNames);
        // Nothing is left holding the event loop open for the rest of the budget after a fast render.
        expect(vi.getTimerCount()).toBe(0);
    });
});
