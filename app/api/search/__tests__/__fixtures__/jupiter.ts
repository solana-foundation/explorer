import { jupiterToken } from '@entities/token-info/__fixtures__/jupiter-token';

import { DEFAULT_ADDRESS } from '@/app/__fixtures__/gen';

export const VALID_ADDRESS = DEFAULT_ADDRESS;

export function makeJupiterToken(overrides: Record<string, unknown> = {}): ReturnType<typeof jupiterToken> {
    return jupiterToken(VALID_ADDRESS, {
        decimals: 9,
        icon: 'https://example.com/sol.png',
        isVerified: true,
        name: 'Wrapped SOL',
        symbol: 'SOL',
        ...overrides,
    });
}
