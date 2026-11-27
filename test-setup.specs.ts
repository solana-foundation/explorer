import type * as SolanaKit from '@solana/kit';
import { beforeEach, vi } from 'vitest';

import { mockSolanaRpc } from './app/__tests__/mock-rpc';

// jsdom storage outlives a test and storage-backed state reads it on first use; node-environment specs have none.
beforeEach(() => {
    globalThis.localStorage?.clear();
    globalThis.sessionStorage?.clear();
});

// Global no-op mock for Logger to suppress console output in all tests.
vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

// Global no-op mock for Sentry to avoid @sentry/nextjs import issues in tests.
vi.mock('@/app/shared/lib/sentry', () => ({
    SentryErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
    withTraceData: vi.fn(() => ({})),
}));

vi.mock('@/app/shared/lib/sentry/server', () => ({
    wrapMcpServerWithSentry: vi.fn(server => server),
}));

// Global mock for @solana/kit to prevent real RPC calls (429s) in tests.
// Tests that need custom RPC behavior should override with a local vi.mock().
vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof SolanaKit>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: vi.fn(() => mockSolanaRpc()),
    };
});
