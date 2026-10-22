import { describe, expect, it } from 'vitest';

import { accountRefreshKey, isAccountRefreshKey } from '../account-refresh-key';

const URL = 'https://api.mainnet-beta.solana.com';
const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

describe('isAccountRefreshKey', () => {
    it.each([
        ['a key without extra parts', accountRefreshKey(URL, ADDRESS, 'raw-account-data')],
        ['a key with extra parts', accountRefreshKey(URL, ADDRESS, 'full-token-info', 'mainnet-beta', undefined)],
    ])('should match %s of the account', (_, key) => {
        expect(isAccountRefreshKey(key, URL, ADDRESS)).toBe(true);
    });

    it.each([
        ['another address', accountRefreshKey(URL, 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'raw-account-data')],
        ['another url', accountRefreshKey('https://api.devnet.solana.com', ADDRESS, 'raw-account-data')],
        ['another prefix', ['raw-account-data', URL, ADDRESS]],
        ['a string', `account-refresh,${URL},${ADDRESS}`],
        ['an object', { 0: 'account-refresh', 1: URL, 2: ADDRESS }],
        ['undefined', undefined],
    ])('should not match %s', (_, key) => {
        expect(isAccountRefreshKey(key, URL, ADDRESS)).toBe(false);
    });
});
