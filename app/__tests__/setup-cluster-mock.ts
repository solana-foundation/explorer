import { vi } from 'vitest';

vi.mock('@solana/kit', async importActual => {
    const actualSolanaKit = await importActual<typeof import('@solana/kit')>();
    const mockUtils = await import('./mock-solana-rpc');
    return mockUtils.isUsingRealRpc()
        ? actualSolanaKit
        : {
              ...actualSolanaKit,
              ...mockUtils.mockSolanaKit(),
          };
});
