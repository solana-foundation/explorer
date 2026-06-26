import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useInstructionNameResolvers } from '../use-instruction-name-resolvers';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.stubGlobal('fetch', mocks.fetch);

const VOTING = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';
const SECOND = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
const SYSTEM = '11111111111111111111111111111111';
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
    return renderHook(() => useInstructionNameResolvers(programIds, cluster, url), { wrapper });
}

describe('useInstructionNameResolvers', () => {
    beforeEach(() =>
        mocks.fetch.mockImplementation((u: string) => {
            const programAddress = new URL(u, 'http://localhost').searchParams.get('programAddress') ?? '';
            return Promise.resolve({
                json: async () => ({ idls: { anchor: IDL_BY_PROGRAM[programAddress] } }),
                ok: true,
            });
        }),
    );
    afterEach(() => vi.restoreAllMocks());

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

    it('should exclude builtin programs and not fetch them', async () => {
        const { result } = render([SYSTEM]);

        await waitFor(() => expect(result.current.size).toBe(0));
        expect(mocks.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/idl-latest'));
    });

    it('should not fetch on a custom/localhost cluster the server route cannot reach', async () => {
        const { result } = render([VOTING], Cluster.Custom, 'http://localhost:8899');

        await waitFor(() => expect(result.current.size).toBe(0));
        expect(mocks.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/idl-latest'));
    });
});
