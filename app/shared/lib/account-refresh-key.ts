export function accountRefreshKey<const Kind extends string, const Rest extends readonly unknown[]>(
    url: string,
    address: string,
    kind: Kind,
    ...rest: Rest
) {
    return ['account-refresh', url, address, kind, ...rest] as const;
}

export function isAccountRefreshKey(key: unknown, url: string, address: string): boolean {
    return Array.isArray(key) && key[0] === 'account-refresh' && key[1] === url && key[2] === address;
}
