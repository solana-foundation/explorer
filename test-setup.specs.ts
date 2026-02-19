import { vi } from 'vitest';

// Global no-op mock for TokenInfoBatchProvider to prevent network requests in all tests.
// Tests that need to assert on batch behavior should override with a local vi.mock().
vi.mock('@/app/entities/token-info/model/token-info-batch-provider', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/token-info/model/token-info-batch-provider')>(
        '@/app/entities/token-info/model/token-info-batch-provider'
    );

    return {
        ...actual,
        useTokenInfoBatch: () => () => {},
    };
});
