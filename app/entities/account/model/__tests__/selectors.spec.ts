import type { Account } from '@providers/accounts';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { selectMintDecimals, selectTokenAccountMint } from '../selectors';

const MINT_PUBKEY = Keypair.generate().publicKey;

function makeBaseAccount(): Account {
    return {
        data: {},
        executable: false,
        lamports: 0,
        owner: SystemProgram.programId,
        pubkey: Keypair.generate().publicKey,
    };
}

function makeMintAccount(decimals: number): Account {
    return {
        ...makeBaseAccount(),
        data: {
            parsed: {
                parsed: {
                    info: {
                        decimals,
                        freezeAuthority: null,
                        isInitialized: true,
                        mintAuthority: Keypair.generate().publicKey.toBase58(),
                        supply: '1000000',
                    },
                    type: 'mint' as const,
                },
                program: 'spl-token' as const,
            },
        },
    };
}

function makeTokenAccount(mint: string): Account {
    return {
        ...makeBaseAccount(),
        data: {
            parsed: {
                parsed: {
                    info: {
                        isNative: false,
                        mint,
                        owner: Keypair.generate().publicKey.toBase58(),
                        state: 'initialized',
                        tokenAmount: { amount: '1000000', decimals: 6, uiAmountString: '1' },
                    },
                    type: 'account' as const,
                },
                program: 'spl-token' as const,
            },
        },
    };
}

const MINT_ADDRESS = MINT_PUBKEY.toBase58();

describe('selectMintDecimals', () => {
    it.each([
        { account: makeMintAccount(9), expected: 9, label: 'mint with 9 decimals' },
        { account: makeMintAccount(0), expected: 0, label: 'mint with 0 decimals' },
        { account: makeTokenAccount(MINT_ADDRESS), expected: undefined, label: 'token account' },
        { account: makeBaseAccount(), expected: undefined, label: 'unparsed account' },
    ])('should return $expected for $label', ({ account, expected }) => {
        expect(selectMintDecimals(account)).toBe(expected);
    });
});

describe('selectTokenAccountMint', () => {
    it.each([
        { account: makeTokenAccount(MINT_ADDRESS), expected: MINT_ADDRESS, label: 'valid token account' },
        { account: makeMintAccount(6), expected: undefined, label: 'mint account' },
        { account: makeBaseAccount(), expected: undefined, label: 'unparsed account' },
    ])('should return $expected for $label', ({ account, expected }) => {
        expect(selectTokenAccountMint(account)).toBe(expected);
    });
});
