import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramIdlNames } from '../use-program-idl-names';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), warn: vi.fn() }));
vi.stubGlobal('fetch', mocks.fetch);
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), warn: mocks.warn } }));

const { warn } = mocks;

const VOTING = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';
const SECOND = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
const SYSTEM = '11111111111111111111111111111111';
const COMPUTE_BUDGET = 'ComputeBudget111111111111111111111111111111';
const VOTE = Uint8Array.from([227, 110, 155, 23, 136, 126, 172, 25]);
const FOO = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);

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

function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
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

        await waitFor(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
    });

    it('should expose the program display name from the IDL metadata', async () => {
        const { result } = render([VOTING]);

        await waitFor(() => expect(result.current.get(VOTING)?.programName).toBe('Voting'));
    });

    it('should resolve every program in the set from one render', async () => {
        const { result } = render([VOTING, SECOND]);

        await waitFor(() => expect(result.current.size).toBe(2));
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

        await waitFor(() => expect(result.current.get(VOTING)?.resolveInstructionName?.(VOTE)).toBe('Vote'));
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

        await waitFor(() => expect(result.current.size).toBe(1));
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('IDL fetch failed'),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ programId: SECOND }),
            }),
        );
    });

    // Compute Budget reaches this hook on nearly every transaction, so its exclusion is load-bearing.
    it('should exclude builtin programs and not fetch them', async () => {
        const { result } = render([SYSTEM, COMPUTE_BUDGET]);

        await waitFor(() => expect(result.current.size).toBe(0));
        expect(mocks.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/idl-latest'));
    });

    it('should not fetch on a custom/localhost cluster the server route cannot reach', async () => {
        const { result } = render([VOTING], Cluster.Custom, 'http://localhost:8899');

        await waitFor(() => expect(result.current.size).toBe(0));
        expect(mocks.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/idl-latest'));
    });
});
