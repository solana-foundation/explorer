import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const TOKEN_2022_PROGRAM_ADDRESS = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

/**
 * Mock transaction data for testing a Token-2022 transferChecked (with optional CreateIdempotent).
 * - Transfer 100 tokens (9 decimals) via Token-2022 program
 * - From (source): 99FC9v1Jt7ZDB7fmZtLbYLt7wpYPfVioRy5NJcGrK7ES (sender Hd3f3's ATA)
 * - To (destination): AvU46uNPpHaPewPwqWNqVLgD9TgQRD8uqFpRRi5PkFDS (receiver 65MUM's ATA)
 * - Authority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - Mint: AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * Receiver: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 */
export const mockToken2022TransferTransaction = {
    blockTime: 1769580206,
    meta: {
        computeUnitsConsumed: 18258,
        costUnits: 20082,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} invoke [2]`,
            'Program log: Instruction: GetAccountDataSize',
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} consumed 1155 of 12917 compute units`,
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} success`,
            'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [1]',
            'Program log: Instruction: TransferChecked',
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} consumed 1960 of 2110 compute units`,
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} success`,
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
        ],
        postBalances: [69073659371, 2074080, 2074080, 1, 1, 1159846, 449960000, 1461600, 934079540],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: 'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: {
                    amount: '100000000000',
                    decimals: 9,
                    uiAmount: 100,
                    uiAmountString: '100',
                },
            },
            {
                accountIndex: 2,
                mint: 'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: {
                    amount: '900000000000',
                    decimals: 9,
                    uiAmount: 900,
                    uiAmountString: '900',
                },
            },
        ],
        preBalances: [69075738451, 2074080, 0, 1, 1, 1159846, 449960000, 1461600, 934079540],
        preTokenBalances: [
            {
                accountIndex: 1,
                mint: 'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: {
                    amount: '1000000000000',
                    decimals: 9,
                    uiAmount: 1000,
                    uiAmountString: '1000',
                },
            },
        ],
    },
    slot: 438171312,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: new PublicKey('Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5'),
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('AvU46uNPpHaPewPwqWNqVLgD9TgQRD8uqFpRRi5PkFDS'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('99FC9v1Jt7ZDB7fmZtLbYLt7wpYPfVioRy5NJcGrK7ES'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('11111111111111111111111111111111'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey(TOKEN_2022_PROGRAM_ADDRESS),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey('ComputeBudget111111111111111111111111111111'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            account: 'AvU46uNPpHaPewPwqWNqVLgD9TgQRD8uqFpRRi5PkFDS',
                            mint: 'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                            systemProgram: '11111111111111111111111111111111',
                            tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
                            wallet: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                        },
                        type: 'createIdempotent',
                    },
                    program: 'spl-associated-token-account',
                    programId: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                },
                {
                    parsed: {
                        info: {
                            authority: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                            destination: 'AvU46uNPpHaPewPwqWNqVLgD9TgQRD8uqFpRRi5PkFDS',
                            mint: 'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                            source: '99FC9v1Jt7ZDB7fmZtLbYLt7wpYPfVioRy5NJcGrK7ES',
                            tokenAmount: {
                                amount: '100000000000',
                                decimals: 9,
                                uiAmount: 100,
                                uiAmountString: '100',
                            },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: new PublicKey(TOKEN_2022_PROGRAM_ADDRESS),
                },
                {
                    accounts: [],
                    data: 'GC3Vaw',
                    programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
                },
            ],
            recentBlockhash: 'CjznuT7TC4cruwFvAaSeZHP2vC7wtt6YwUyfKWZHv2fY',
        },
        signatures: ['2oSMCYeEPGZq5LLrNcDBw8TRq2H7Dxo4uxgHvuJKTWoTyRBGN87uZFTZy7o2iRVmDeB72nvr91dAkwAciiwQWTgL'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
