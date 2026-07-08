export const VALID_ADDRESS = 'So11111111111111111111111111111111111111112';

export function makeJupiterToken(overrides: Record<string, unknown> = {}) {
    return {
        decimals: 9,
        id: VALID_ADDRESS,
        isVerified: true,
        logoURI: 'https://example.com/sol.png',
        name: 'Wrapped SOL',
        symbol: 'SOL',
        ...overrides,
    };
}
