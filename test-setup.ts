import '@testing-library/jest-dom';

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

if (!AbortSignal.timeout) {
    AbortSignal.timeout = ms => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}

// Needed for @solana/web3.js to treat Uint8Arrays as Buffers
// See https://github.com/anza-xyz/solana-pay/issues/106
const originalHasInstance = Uint8Array[Symbol.hasInstance];
Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value(potentialInstance: any) {
        return originalHasInstance.call(this, potentialInstance) || Buffer.isBuffer(potentialInstance);
    },
});
