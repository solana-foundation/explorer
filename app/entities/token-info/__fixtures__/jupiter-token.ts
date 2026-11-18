// Jupiter omits `isVerified` for a mint it does not verify.
export function jupiterToken(id: string, overrides: Record<string, unknown> = {}) {
    return { decimals: 6, icon: null, id, name: id, symbol: id, ...overrides };
}
