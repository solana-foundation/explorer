export function jupiterToken(id: string, overrides: Record<string, unknown> = {}) {
    return { decimals: 6, icon: null, id, isVerified: false, name: id, symbol: id, ...overrides };
}
