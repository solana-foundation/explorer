import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { customIdlStorage } from '../../api/custom-idl-storage';
import { useProgramIdlNames } from '../use-program-idl-names';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.stubGlobal('fetch', mocks.fetch);

const VOTING = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';
const SECOND = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
const SYSTEM = '11111111111111111111111111111111';
const COMPUTE_BUDGET = 'ComputeBudget111111111111111111111111111111';
const DEVI = anchorModernIdl.address;
const VOTE = Uint8Array.from([227, 110, 155, 23, 136, 126, 172, 25]);
const FOO = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
const CREATE_AMM_CONFIG = Uint8Array.from([137, 52, 237, 212, 215, 117, 108, 104]);

const IDL_BY_PROGRAM: Record<string, unknown> = {
    [SECOND]: {
        instructions: [{ accounts: [], args: [], discriminator: [...FOO], name: 'foo' }],
        metadata: { name: 'second', spec: '0.1.0' },
    },
    [VOTING]: {
        instructions: [{ accounts: [], args: [], discriminator: [...VOTE], name: 'vote' }],
        metadata: { name: 'voting', spec: '0.1.0' },
    },
};

const SwrWrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

function wrapper({ children }: { children: ReactNode }) {
    return (
        <JotaiProvider>
            <SwrWrapper>{children}</SwrWrapper>
        </JotaiProvider>
    );
}

function render(programIds: string[], cluster = Cluster.Devnet, url = 'https://api.devnet.solana.com') {
    return renderHook(() => useProgramIdlNames(programIds, cluster, url), { wrapper });
}

describe('useProgramIdlNames', () => {
    beforeEach(() =>
        mocks.fetch.mockImplementation((u: string) => {
            const programAddress = new URL(u, 'http://localhost').searchParams.get('programAddress') ?? '';
            return Promise.resolve({
                json: async () => ({ idls: { anchor: IDL_BY_PROGRAM[programAddress] } }),
                ok: true,
            });
        }),
    );
    // Vitest 4: vi.restoreAllMocks() no longer clears call history, so clear the
    // shared fetch mock between tests to keep toHaveBeenCalledWith assertions scoped.
    afterEach(() => vi.clearAllMocks());

    it('should build a resolver that names an instruction by discriminator', async () => {
        const { result } = render([VOTING]);

        await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
    });

    it('should expose the program display name from the IDL metadata', async () => {
        const { result } = render([VOTING]);

        await waitForHook(() => expect(result.current.get(VOTING)?.programName).toBe('Voting'));
    });

    it('should resolve every program in the set from one render', async () => {
        const { result } = render([VOTING, SECOND]);

        await waitForHook(() => expect(result.current.size).toBe(2));
        expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote');
        expect(result.current.get(VOTING)?.programName).toBe('Voting');
        expect(result.current.get(SECOND)?.resolveInstructionName?.(FOO)).toBe('Foo');
        expect(result.current.get(SECOND)?.programName).toBe('Second');
    });

    it('should still resolve the healthy programs when one program’s IDL fetch fails', async () => {
        mocks.fetch.mockImplementation((u: string) => {
            const programAddress = new URL(u, 'http://localhost').searchParams.get('programAddress') ?? '';
            if (programAddress === SECOND) return Promise.resolve({ ok: false, status: 502 });
            return Promise.resolve({
                json: async () => ({ idls: { anchor: IDL_BY_PROGRAM[programAddress] } }),
                ok: true,
            });
        });

        const { result } = render([VOTING, SECOND]);

        await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
        expect(result.current.size).toBe(1);
        expect(result.current.get(SECOND)).toBeUndefined();
    });

    /**
     * A dropped rejection is indistinguishable from "this program has no IDL" and from "still loading" —
     * all three render the same unnamed instruction. The reason goes in `sentryExtras` because this runs
     * in the browser, where console output is suppressed and plain context fields never leave it.
     */
    it('should report a failed IDL fetch with the program and reason attached', async () => {
        mocks.fetch.mockImplementation((u: string) => {
            const programAddress = new URL(u, 'http://localhost').searchParams.get('programAddress') ?? '';
            if (programAddress === SECOND) return Promise.resolve({ ok: false, status: 502 });
            return Promise.resolve({
                json: async () => ({ idls: { anchor: IDL_BY_PROGRAM[programAddress] } }),
                ok: true,
            });
        });

        const { result } = render([VOTING, SECOND]);

        await waitForHook(() => expect(result.current.size).toBe(1));
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('IDL fetch failed'),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ programId: SECOND }),
            }),
        );
    });

    // Compute Budget reaches this hook on nearly every transaction, so its exclusion is load-bearing.
    it('should exclude builtin programs and not fetch them', async () => {
        const { result } = render([SYSTEM, COMPUTE_BUDGET, VOTING]);

        await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
        const fetched = mocks.fetch.mock.calls.flat().join(' ');
        expect(fetched).not.toContain(SYSTEM);
        expect(fetched).not.toContain(COMPUTE_BUDGET);
    });

    it('should not fetch on a custom/localhost cluster the server route cannot reach', async () => {
        await storeCustomIdl(DEVI, anchorModernIdl, 'custom');

        const { result } = render([DEVI, VOTING], Cluster.Custom, 'http://localhost:8899');

        await waitForHook(() =>
            expect(result.current.get(DEVI)?.resolveInstructionName?.(CREATE_AMM_CONFIG)).toBe('Create Amm Config'),
        );
        expect(mocks.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/idl-latest'));
    });

    describe('custom IDL', () => {
        it('should not fetch the on-chain IDLs of a program with a selected custom IDL', async () => {
            await storeCustomIdl(DEVI, anchorModernIdl, 'custom');

            const { result } = render([DEVI, VOTING]);

            await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
            expect(result.current.get(DEVI)?.resolveInstructionName?.(CREATE_AMM_CONFIG)).toBe('Create Amm Config');
            expect(mocks.fetch.mock.calls.flat().join(' ')).not.toContain(DEVI);
        });

        it('should name a builtin program from its selected custom IDL without a fetch', async () => {
            await storeCustomIdl(COMPUTE_BUDGET, { ...anchorModernIdl, address: COMPUTE_BUDGET }, 'custom');

            const { result } = render([COMPUTE_BUDGET, VOTING]);

            await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
            expect(result.current.get(COMPUTE_BUDGET)?.resolveInstructionName?.(CREATE_AMM_CONFIG)).toBe(
                'Create Amm Config',
            );
            expect(mocks.fetch.mock.calls.flat().join(' ')).not.toContain(COMPUTE_BUDGET);
        });

        it('should name a program from its on-chain IDLs when On-chain is selected', async () => {
            await storeCustomIdl(VOTING, { ...anchorModernIdl, address: VOTING }, 'onChain');

            const { result } = render([VOTING]);

            await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
            expect(result.current.get(VOTING)?.resolveInstructionName?.(CREATE_AMM_CONFIG)).toBeUndefined();
        });

        it('should name a program from its on-chain IDLs when the browser blocks storage', async () => {
            vi.spyOn(indexedDB, 'open').mockImplementation(() => {
                throw new DOMException('blocked', 'SecurityError');
            });

            const { result } = render([VOTING]);

            await waitForHook(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
        });
    });
});

function storeCustomIdl(address: string, idl: object, selected: string) {
    return customIdlStorage.put({
        programAddress: address,
        value: JSON.stringify({ idl, origin: { kind: 'pasted' }, selected }),
    });
}
