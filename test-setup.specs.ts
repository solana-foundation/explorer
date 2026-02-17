import { vi } from 'vitest';

vi.mock('@/app/entities/token-info/model/token-info-batch-provider', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/token-info/model/token-info-batch-provider')>(
        '@/app/entities/token-info/model/token-info-batch-provider'
    );

    return {
        ...actual,
        useTokenInfoBatch: () => () => {},
    };
});
