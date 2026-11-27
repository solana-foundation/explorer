export function jupiterToken(id: string, overrides: Record<string, unknown> = {}) {
    return { decimals: 6, icon: null, id, name: id, symbol: id, usdPrice: 1, ...overrides };
}
