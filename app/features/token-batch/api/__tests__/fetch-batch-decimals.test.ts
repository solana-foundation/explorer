import { type AccountInfo, Keypair, type ParsedAccountData } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { fetchDecimals, type ParsedAccountFetcher } from '../fetch-batch-decimals';

describe('fetchDecimals', () => {
    it('should return empty map for empty lookups', async () => {
        const result = await fetchDecimals([], stubFetcher([]));
        expect(result.size).toBe(0);
    });

    it('should resolve decimals for a direct mint lookup (MintTo)', async () => {
        const mintAddr = Keypair.generate().publicKey.toBase58();
        const fetcher = stubFetcher([[parsedMint(9)]]);

        const result = await fetchDecimals([{ kind: 'mint', mintAddress: mintAddr, subIndex: 0 }], fetcher);

        expect(result.get(0)).toBe(9);
    });

    it('should resolve decimals for a token account lookup (Transfer) via two hops', async () => {
        const sourceAddr = Keypair.generate().publicKey.toBase58();
        const mintAddr = Keypair.generate().publicKey.toBase58();

        const fetcher = stubFetcher([
            [parsedTokenAccount(mintAddr)], // hop 1: source → discover mint
            [parsedMint(6)], // hop 2: mint → decimals
        ]);

        const result = await fetchDecimals(
            [{ kind: 'tokenAccount', subIndex: 0, tokenAccountAddress: sourceAddr }],
            fetcher,
        );

        expect(result.get(0)).toBe(6);
    });

    it('should skip second hop when mint was already fetched', async () => {
        const mintAddr = Keypair.generate().publicKey.toBase58();
        const sourceAddr = Keypair.generate().publicKey.toBase58();
        let fetchCount = 0;

        const fetcher: ParsedAccountFetcher = {
            getMultipleParsedAccounts: async () => {
                fetchCount++;
                if (fetchCount === 1) {
                    // Both the mint (direct) and source token account in one batch
                    return { context: { slot: 0 }, value: [parsedMint(6), parsedTokenAccount(mintAddr)] };
                }
                throw new Error('Unexpected second call');
            },
        };

        const result = await fetchDecimals(
            [
                { kind: 'mint', mintAddress: mintAddr, subIndex: 0 },
                { kind: 'tokenAccount', subIndex: 1, tokenAccountAddress: sourceAddr },
            ],
            fetcher,
        );

        expect(fetchCount).toBe(1);
        expect(result.get(0)).toBe(6);
        expect(result.get(1)).toBe(6);
    });

    it('should deduplicate addresses across lookups', async () => {
        const sharedAddr = Keypair.generate().publicKey.toBase58();
        const mintAddr = Keypair.generate().publicKey.toBase58();
        const requestedKeys: string[][] = [];

        const fetcher: ParsedAccountFetcher = {
            getMultipleParsedAccounts: async keys => {
                requestedKeys.push(keys.map(k => k.toBase58()));
                if (requestedKeys.length === 1) {
                    return { context: { slot: 0 }, value: [parsedTokenAccount(mintAddr)] };
                }
                return { context: { slot: 0 }, value: [parsedMint(9)] };
            },
        };

        const result = await fetchDecimals(
            [
                { kind: 'tokenAccount', subIndex: 0, tokenAccountAddress: sharedAddr },
                { kind: 'tokenAccount', subIndex: 1, tokenAccountAddress: sharedAddr },
            ],
            fetcher,
        );

        // Only one unique address in the first RPC call
        expect(requestedKeys[0]).toHaveLength(1);
        expect(result.get(0)).toBe(9);
        expect(result.get(1)).toBe(9);
    });

    it('should return empty map when account is null', async () => {
        const addr = Keypair.generate().publicKey.toBase58();
        const fetcher = stubFetcher([[null]]);

        const result = await fetchDecimals([{ kind: 'mint', mintAddress: addr, subIndex: 0 }], fetcher);

        expect(result.size).toBe(0);
    });

    it('should return empty map when account has no parsed data', async () => {
        const addr = Keypair.generate().publicKey.toBase58();
        const raw: StubAccountInfo = {
            data: Buffer.from([1, 2, 3]),
            executable: false,
            lamports: 0,
            owner: Keypair.generate().publicKey,
            rentEpoch: 0,
        };
        const fetcher = stubFetcher([[raw]]);

        const result = await fetchDecimals([{ kind: 'mint', mintAddress: addr, subIndex: 0 }], fetcher);

        expect(result.size).toBe(0);
    });

    it('should skip token account when mint field is missing', async () => {
        const addr = Keypair.generate().publicKey.toBase58();
        const fetcher = stubFetcher([
            [accountInfo({ parsed: { info: { owner: 'something' } }, program: 'spl-token', space: 165 })],
        ]);

        const result = await fetchDecimals([{ kind: 'tokenAccount', subIndex: 0, tokenAccountAddress: addr }], fetcher);

        expect(result.size).toBe(0);
    });

    it('should handle mixed direct and token-account lookups', async () => {
        const mintAddr = Keypair.generate().publicKey.toBase58();
        const sourceAddr = Keypair.generate().publicKey.toBase58();
        const discoveredMint = Keypair.generate().publicKey.toBase58();

        const fetcher = stubFetcher([
            [parsedMint(6), parsedTokenAccount(discoveredMint)], // batch 1: mint + source
            [parsedMint(9)], // batch 2: discovered mint
        ]);

        const result = await fetchDecimals(
            [
                { kind: 'mint', mintAddress: mintAddr, subIndex: 0 },
                { kind: 'tokenAccount', subIndex: 1, tokenAccountAddress: sourceAddr },
            ],
            fetcher,
        );

        expect(result.get(0)).toBe(6);
        expect(result.get(1)).toBe(9);
    });
});

function parsedMint(decimals: number) {
    return accountInfo({
        parsed: {
            info: {
                decimals,
                freezeAuthority: undefined,
                isInitialized: true,
                mintAuthority: 'Auth1',
                supply: '1000000',
            },
            type: 'mint',
        },
        program: 'spl-token',
        space: 82,
    });
}

function parsedTokenAccount(mint: string) {
    return accountInfo({
        parsed: {
            info: {
                isNative: false,
                mint,
                owner: 'Owner1',
                state: 'initialized',
                tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
            type: 'account',
        },
        program: 'spl-token',
        space: 165,
    });
}

type StubAccountInfo = AccountInfo<Buffer | ParsedAccountData>;

function accountInfo(data: ParsedAccountData): StubAccountInfo {
    return { data, executable: false, lamports: 0, owner: Keypair.generate().publicKey, rentEpoch: 0 };
}

function stubFetcher(responses: (StubAccountInfo | null)[][]): ParsedAccountFetcher {
    let call = 0;
    return {
        getMultipleParsedAccounts: async () => {
            const value = responses[call] ?? [];
            call++;
            return { context: { slot: 0 }, value };
        },
    };
}
