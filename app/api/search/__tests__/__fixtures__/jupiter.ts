import { DEFAULT_ADDRESS } from '@/app/__fixtures__/gen';

export const VALID_ADDRESS = DEFAULT_ADDRESS;

export function makeJupiterToken(overrides: Record<string, unknown> = {}) {
    return {
        decimals: 9,
        icon: 'https://example.com/sol.png',
        id: VALID_ADDRESS,
        isVerified: true,
        name: 'Wrapped SOL',
        symbol: 'SOL',
        ...overrides,
    };
}
