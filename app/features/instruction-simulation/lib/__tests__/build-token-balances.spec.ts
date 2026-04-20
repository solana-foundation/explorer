import { Keypair, PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { alloc, toBase64, writeU64LE } from '@/app/shared/lib/bytes';

import {
    PARSED_USDC_TOKEN_ACCOUNT,
    POST_SYSTEM_ACCOUNT,
    postAccount,
    SOME_KEY,
    TOKEN_PROGRAM_ADDRESS,
    USDC_MINT,
} from '../../mocks/token-accounts';
import { buildTokenBalances } from '../build-token-balances';

const UNKNOWN_MINT = Keypair.generate().publicKey;

describe('buildTokenBalances', () => {
    it('should skip post-simulation token account when mint decimals are unknown', () => {
        const tokenAccountBase64 = encodeTokenAccountBase64(UNKNOWN_MINT, SOME_KEY, 1_000_000n);

        const result = buildTokenBalances(
            [SOME_KEY],
            [undefined],
            [postAccount(tokenAccountBase64, TOKEN_PROGRAM_ADDRESS)],
            {}, // empty decimals map — mint is unknown
        );

        expect(result.postTokenBalances).toEqual([]);
    });

    it('should include post-simulation token account when mint decimals are known', () => {
        const tokenAccountBase64 = encodeTokenAccountBase64(USDC_MINT, SOME_KEY, 1_000_000n);

        const result = buildTokenBalances(
            [SOME_KEY],
            [undefined],
            [postAccount(tokenAccountBase64, TOKEN_PROGRAM_ADDRESS)],
            {
                [USDC_MINT.toBase58()]: 6,
            },
        );

        expect(result.postTokenBalances).toHaveLength(1);
        expect(result.postTokenBalances[0]).toMatchObject({
            mint: USDC_MINT.toBase58(),
            uiTokenAmount: { amount: '1000000', decimals: 6 },
        });
    });

    it('should extract pre-simulation token balance from parsed account data', () => {
        const result = buildTokenBalances([SOME_KEY], [PARSED_USDC_TOKEN_ACCOUNT], [POST_SYSTEM_ACCOUNT], {});

        expect(result.preTokenBalances).toHaveLength(1);
        expect(result.preTokenBalances[0]).toMatchObject({
            mint: USDC_MINT.toBase58(),
            owner: SOME_KEY.toBase58(),
        });
    });

    it('should populate accountKeys for every account in the transaction', () => {
        const keyA = SOME_KEY;
        const keyB = USDC_MINT;

        const result = buildTokenBalances([keyA, keyB], [undefined, undefined], [POST_SYSTEM_ACCOUNT, undefined], {});

        expect(result.accountKeys).toHaveLength(2);
        expect(result.accountKeys[0].pubkey).toBe(keyA);
        expect(result.accountKeys[1].pubkey).toBe(keyB);
    });
});

function encodeTokenAccountBase64(mint: PublicKey, owner: PublicKey, amount: bigint): string {
    const buf = alloc(165);
    let offset = 0;

    buf.set(mint.toBytes(), offset);
    offset += 32;
    buf.set(owner.toBytes(), offset);
    offset += 32;
    buf.set(writeU64LE(amount), offset);
    offset += 8;
    // delegateOption (u32) = 0, delegate (32 bytes) = zeroed, state (u8) = 1 (initialized)
    offset += 4 + 32;
    buf[offset] = 1;

    return toBase64(buf);
}
