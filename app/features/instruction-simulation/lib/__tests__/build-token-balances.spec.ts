import { address, none } from '@solana/kit';
import { Keypair, PublicKey } from '@solana/web3.js';
import { AccountState, getTokenEncoder, getTokenSize } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import { alloc, toBase64 } from '@/app/shared/lib/bytes';

import {
    PARSED_USDC_TOKEN_ACCOUNT,
    POST_SYSTEM_ACCOUNT,
    postAccount,
    SOME_KEY,
    TOKEN_2022_PROGRAM_ADDRESS,
    TOKEN_PROGRAM_ADDRESS,
    USDC_MINT,
} from '../../mocks/token-accounts';
import { buildTokenBalances } from '../build-token-balances';
import { ACCOUNT_TYPE_TOKEN } from '../token-layout';

const UNKNOWN_MINT = Keypair.generate().publicKey;
const TOKEN_ACCOUNT_SIZE = getTokenSize();
const TOKEN_2022_MULTISIG_SIZE = 355;
/** Offset of the account-state byte: mint (32) + owner (32) + amount (8) + delegate COption<Address> (4 + 32) */
const STATE_OFFSET = 108;
const tokenEncoder = getTokenEncoder();

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

    it('should skip post-simulation account whose account-state byte is out of range', () => {
        const corruptBase64 = encodeTokenAccountBase64(USDC_MINT, SOME_KEY, 1_000_000n, { state: 255 });

        const result = buildTokenBalances(
            [SOME_KEY],
            [undefined],
            [postAccount(corruptBase64, TOKEN_PROGRAM_ADDRESS)],
            { [USDC_MINT.toBase58()]: 6 },
        );

        expect(result.postTokenBalances).toEqual([]);
    });

    it('should skip an oversized Token-2022 account with a corrupt state byte and keep the other balances', () => {
        // A Token-2022 multisig passes the size and account-type filters but is not a token account
        const multisigBase64 = encodeTokenAccountBase64(USDC_MINT, SOME_KEY, 1_000_000n, {
            state: 255,
            totalSize: TOKEN_2022_MULTISIG_SIZE,
        });
        const validBase64 = encodeTokenAccountBase64(USDC_MINT, SOME_KEY, 2_000_000n);

        const result = buildTokenBalances(
            [SOME_KEY, USDC_MINT],
            [undefined, undefined],
            [postAccount(multisigBase64, TOKEN_2022_PROGRAM_ADDRESS), postAccount(validBase64, TOKEN_PROGRAM_ADDRESS)],
            { [USDC_MINT.toBase58()]: 6 },
        );

        expect(result.postTokenBalances).toHaveLength(1);
        expect(result.postTokenBalances[0]).toMatchObject({
            accountIndex: 1,
            uiTokenAmount: { amount: '2000000', decimals: 6 },
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

function encodeTokenAccountBase64(
    mint: PublicKey,
    owner: PublicKey,
    amount: bigint,
    { state, totalSize = TOKEN_ACCOUNT_SIZE }: { state?: number; totalSize?: number } = {},
): string {
    const encoded = tokenEncoder.encode({
        amount,
        closeAuthority: none(),
        delegate: none(),
        delegatedAmount: 0n,
        isNative: none(),
        mint: address(mint.toBase58()),
        owner: address(owner.toBase58()),
        state: AccountState.Initialized,
    });

    const buf = alloc(totalSize);
    buf.set(encoded);

    // The encoder only accepts in-range AccountState values, so corrupt vectors patch the byte directly
    if (state !== undefined) buf[STATE_OFFSET] = state;
    if (totalSize > TOKEN_ACCOUNT_SIZE) buf[TOKEN_ACCOUNT_SIZE] = ACCOUNT_TYPE_TOKEN;

    return toBase64(buf);
}
