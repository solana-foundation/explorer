import { parseExternalExplorerUrl } from '../external-explorer-url';

describe('parseExternalExplorerUrl', () => {
    describe('should return null for non-URL input', () => {
        it.each([
            'not-a-url',
            '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            '12345',
            '',
            'solscan.io/tx/abc',
        ])('should reject "%s"', input => {
            expect(parseExternalExplorerUrl(input)).toBeNull();
        });
    });

    describe('should return null for unknown hostnames', () => {
        it('should reject unrecognized explorer', () => {
            expect(parseExternalExplorerUrl('https://solana.fm/address/abc123')).toBeNull();
        });
    });

    describe('should return null for URLs with missing or invalid path segments', () => {
        it('should reject Solscan root', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/')).toBeNull();
        });

        it('should reject entity type without identifier', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/account')).toBeNull();
            expect(parseExternalExplorerUrl('https://solscan.io/account/')).toBeNull();
        });

        it('should reject unsupported entity types', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/nft/abc123')).toBeNull();
            expect(parseExternalExplorerUrl('https://orbmarkets.io/stats')).toBeNull();
        });

        it('should reject whitespace-only identifier', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/account/%20')).toBeNull();
        });

        it('should reject identifier containing a slash', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/account/a%2Fb')).toBeNull();
        });
    });

    describe('Solscan', () => {
        const ADDR = 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg';
        const SIG = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQTnFnRbjPoockqBcbQBqzF948KBRYG5g';

        it('should parse account URL', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                preserveSearchParams: true,
                value: [`https://solscan.io/account/${ADDR}`, ADDR],
            });
        });

        it('should parse transaction URL', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/tx/${SIG}`);
            expect(result).toEqual({
                label: SIG,
                pathname: `/tx/${SIG}`,
                preserveSearchParams: true,
                value: [`https://solscan.io/tx/${SIG}`, SIG],
            });
        });

        it('should parse token URL as address', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/token/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                preserveSearchParams: true,
                value: [`https://solscan.io/token/${ADDR}`, ADDR],
            });
        });

        it('should parse block URL', () => {
            const result = parseExternalExplorerUrl('https://solscan.io/block/123456');
            expect(result).toEqual({
                label: '123456',
                pathname: '/block/123456',
                preserveSearchParams: true,
                value: ['https://solscan.io/block/123456', '123456'],
            });
        });

        it('should handle www prefix', () => {
            const result = parseExternalExplorerUrl(`https://www.solscan.io/account/${ADDR}`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });

        it('should propagate devnet cluster and set preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/tx/${SIG}?cluster=devnet`);
            expect(result?.pathname).toBe(`/tx/${SIG}?cluster=devnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should propagate testnet cluster and set preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}?cluster=testnet`);
            expect(result?.pathname).toBe(`/address/${ADDR}?cluster=testnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should set preserveSearchParams for implicit mainnet (no cluster param)', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}`);
            expect(result?.pathname).toBe(`/address/${ADDR}`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should set preserveSearchParams for explicit mainnet-beta cluster', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}?cluster=mainnet-beta`);
            expect(result?.pathname).toBe(`/address/${ADDR}`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should ignore unknown cluster values', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}?cluster=localnet`);
            expect(result?.pathname).toBe(`/address/${ADDR}`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should strip sub-paths after identifier', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}/transfers`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });

        it('should decode percent-encoded identifier', () => {
            const result = parseExternalExplorerUrl('https://solscan.io/account/abc%20def');
            expect(result).not.toBeNull();
            expect(result?.label).toBe('abc def');
        });
    });

    describe('Orb Markets', () => {
        const ADDR = 'So11111111111111111111111111111111111111112';
        const SIG = '5UfDuX7hXgMgWc3bTKTiKjsiKXqMhQmQhNgYoJxYBgDGaAdC1AUDkZPjSvANjWjTEcaEU9yF4XhJvR7XHCxasYp';

        it('should parse address URL', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/address/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                preserveSearchParams: true,
                value: [`https://orbmarkets.io/address/${ADDR}`, ADDR],
            });
        });

        it('should parse transaction URL', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/tx/${SIG}`);
            expect(result).toEqual({
                label: SIG,
                pathname: `/tx/${SIG}`,
                preserveSearchParams: true,
                value: [`https://orbmarkets.io/tx/${SIG}`, SIG],
            });
        });

        it('should parse block URL', () => {
            const result = parseExternalExplorerUrl('https://orbmarkets.io/block/999');
            expect(result).toEqual({
                label: '999',
                pathname: '/block/999',
                preserveSearchParams: true,
                value: ['https://orbmarkets.io/block/999', '999'],
            });
        });

        it('should parse epoch URL', () => {
            const result = parseExternalExplorerUrl('https://orbmarkets.io/epoch/450');
            expect(result).toEqual({
                label: '450',
                pathname: '/epoch/450',
                preserveSearchParams: true,
                value: ['https://orbmarkets.io/epoch/450', '450'],
            });
        });

        it('should handle www prefix', () => {
            const result = parseExternalExplorerUrl(`https://www.orbmarkets.io/address/${ADDR}`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });

        it('should propagate devnet cluster and set preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/tx/${SIG}?cluster=devnet`);
            expect(result?.pathname).toBe(`/tx/${SIG}?cluster=devnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('should strip sub-paths like /history', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/address/${ADDR}/history`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });
    });

    describe('protocol handling', () => {
        it('should accept http URLs', () => {
            const result = parseExternalExplorerUrl('http://solscan.io/account/abc123');
            expect(result).not.toBeNull();
        });

        it('should reject non-http protocols', () => {
            expect(parseExternalExplorerUrl('ftp://solscan.io/account/abc123')).toBeNull();
        });
    });
});
