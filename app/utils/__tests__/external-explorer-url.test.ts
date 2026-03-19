import { parseExternalExplorerUrl } from '../external-explorer-url';

describe('parseExternalExplorerUrl', () => {
    describe('returns null for non-URL input', () => {
        it.each([
            'not-a-url',
            '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            '12345',
            '',
            'solscan.io/tx/abc',
        ])('rejects "%s"', input => {
            expect(parseExternalExplorerUrl(input)).toBeNull();
        });
    });

    describe('returns null for unknown hostnames', () => {
        it('rejects unrecognized explorer', () => {
            expect(parseExternalExplorerUrl('https://solana.fm/address/abc123')).toBeNull();
        });
    });

    describe('returns null for URLs with missing path segments', () => {
        it('rejects Solscan root', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/')).toBeNull();
        });

        it('rejects entity type without identifier', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/account')).toBeNull();
            expect(parseExternalExplorerUrl('https://solscan.io/account/')).toBeNull();
        });

        it('rejects unsupported entity types', () => {
            expect(parseExternalExplorerUrl('https://solscan.io/nft/abc123')).toBeNull();
            expect(parseExternalExplorerUrl('https://orbmarkets.io/stats')).toBeNull();
        });
    });

    describe('Solscan', () => {
        const ADDR = 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg';
        const SIG = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQTnFnRbjPoockqBcbQBqzF948KBRYG5g';

        it('parses account URL', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                value: [`https://solscan.io/account/${ADDR}`, ADDR],
            });
        });

        it('parses transaction URL', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/tx/${SIG}`);
            expect(result).toEqual({
                label: SIG,
                pathname: `/tx/${SIG}`,
                value: [`https://solscan.io/tx/${SIG}`, SIG],
            });
        });

        it('parses token URL as address', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/token/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                value: [`https://solscan.io/token/${ADDR}`, ADDR],
            });
        });

        it('parses block URL', () => {
            const result = parseExternalExplorerUrl('https://solscan.io/block/123456');
            expect(result).toEqual({
                label: '123456',
                pathname: '/block/123456',
                value: ['https://solscan.io/block/123456', '123456'],
            });
        });

        it('handles www prefix', () => {
            const result = parseExternalExplorerUrl(`https://www.solscan.io/account/${ADDR}`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });

        it('propagates devnet cluster and sets preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/tx/${SIG}?cluster=devnet`);
            expect(result?.pathname).toBe(`/tx/${SIG}?cluster=devnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('propagates testnet cluster and sets preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}?cluster=testnet`);
            expect(result?.pathname).toBe(`/address/${ADDR}?cluster=testnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('omits mainnet-beta cluster (default) and does not set preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}`);
            expect(result?.pathname).toBe(`/address/${ADDR}`);
            expect(result?.preserveSearchParams).toBeUndefined();
        });

        it('ignores unknown cluster values and does not set preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}?cluster=localnet`);
            expect(result?.pathname).toBe(`/address/${ADDR}`);
            expect(result?.preserveSearchParams).toBeUndefined();
        });

        it('strips sub-paths after identifier', () => {
            const result = parseExternalExplorerUrl(`https://solscan.io/account/${ADDR}/transfers`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });
    });

    describe('Orb Markets', () => {
        const ADDR = 'So11111111111111111111111111111111111111112';
        const SIG = '5UfDuX7hXgMgWc3bTKTiKjsiKXqMhQmQhNgYoJxYBgDGaAdC1AUDkZPjSvANjWjTEcaEU9yF4XhJvR7XHCxasYp';

        it('parses address URL', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/address/${ADDR}`);
            expect(result).toEqual({
                label: ADDR,
                pathname: `/address/${ADDR}`,
                value: [`https://orbmarkets.io/address/${ADDR}`, ADDR],
            });
        });

        it('parses transaction URL', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/tx/${SIG}`);
            expect(result).toEqual({
                label: SIG,
                pathname: `/tx/${SIG}`,
                value: [`https://orbmarkets.io/tx/${SIG}`, SIG],
            });
        });

        it('parses block URL', () => {
            const result = parseExternalExplorerUrl('https://orbmarkets.io/block/999');
            expect(result).toEqual({
                label: '999',
                pathname: '/block/999',
                value: ['https://orbmarkets.io/block/999', '999'],
            });
        });

        it('parses epoch URL', () => {
            const result = parseExternalExplorerUrl('https://orbmarkets.io/epoch/450');
            expect(result).toEqual({
                label: '450',
                pathname: '/epoch/450',
                value: ['https://orbmarkets.io/epoch/450', '450'],
            });
        });

        it('handles www prefix', () => {
            const result = parseExternalExplorerUrl(`https://www.orbmarkets.io/address/${ADDR}`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });

        it('propagates devnet cluster and sets preserveSearchParams', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/tx/${SIG}?cluster=devnet`);
            expect(result?.pathname).toBe(`/tx/${SIG}?cluster=devnet`);
            expect(result?.preserveSearchParams).toBe(true);
        });

        it('strips sub-paths like /history', () => {
            const result = parseExternalExplorerUrl(`https://orbmarkets.io/address/${ADDR}/history`);
            expect(result).not.toBeNull();
            expect(result?.pathname).toBe(`/address/${ADDR}`);
        });
    });

    describe('protocol handling', () => {
        it('accepts http URLs', () => {
            const result = parseExternalExplorerUrl('http://solscan.io/account/abc123');
            expect(result).not.toBeNull();
        });

        it('rejects non-http protocols', () => {
            expect(parseExternalExplorerUrl('ftp://solscan.io/account/abc123')).toBeNull();
        });
    });
});
