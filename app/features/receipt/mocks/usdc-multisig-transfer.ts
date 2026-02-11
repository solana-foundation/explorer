import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

import {
    DESTINATION_TOKEN_ACCOUNT,
    MINT,
    MULTISIG_AUTHORITY,
    RECEIVER,
    SENDER,
    SOURCE_TOKEN_ACCOUNT,
} from './addresses';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export const mockUsdcMultisigTransferTransaction = {
    blockTime: 1769070184,
    meta: {
        computeUnitsConsumed: 6349,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        ],
        postBalances: [55479304131, 2039280, 2039280, 1],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: MINT.publicKey.toBase58(),
                owner: RECEIVER.publicKey.toBase58(),
                programId: TOKEN_PROGRAM_ID.toBase58(),
                uiTokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
            {
                accountIndex: 2,
                mint: MINT.publicKey.toBase58(),
                owner: SENDER.publicKey.toBase58(),
                programId: TOKEN_PROGRAM_ID.toBase58(),
                uiTokenAmount: { amount: '19000000', decimals: 6, uiAmount: 19, uiAmountString: '19' },
            },
        ],
        preBalances: [55479309131, 2039280, 2039280, 1],
        preTokenBalances: [
            {
                accountIndex: 1,
                mint: MINT.publicKey.toBase58(),
                owner: RECEIVER.publicKey.toBase58(),
                programId: TOKEN_PROGRAM_ID.toBase58(),
                uiTokenAmount: { amount: '0', decimals: 6, uiAmount: null, uiAmountString: '0' },
            },
            {
                accountIndex: 2,
                mint: MINT.publicKey.toBase58(),
                owner: SENDER.publicKey.toBase58(),
                programId: TOKEN_PROGRAM_ID.toBase58(),
                uiTokenAmount: { amount: '20000000', decimals: 6, uiAmount: 20, uiAmountString: '20' },
            },
        ],
    },
    slot: 436846205,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: SENDER.publicKey,
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: DESTINATION_TOKEN_ACCOUNT.publicKey,
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: SOURCE_TOKEN_ACCOUNT.publicKey,
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: TOKEN_PROGRAM_ID,
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            destination: DESTINATION_TOKEN_ACCOUNT.publicKey.toBase58(),
                            mint: MINT.publicKey.toBase58(),
                            multisigAuthority: MULTISIG_AUTHORITY.publicKey.toBase58(),
                            source: SOURCE_TOKEN_ACCOUNT.publicKey.toBase58(),
                            tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: TOKEN_PROGRAM_ID,
                },
            ],
            recentBlockhash: 'Eo7YPFE1694LpMwhb5RygaJJBfNzbVGz383Y2uErk9uS',
        },
        signatures: ['3xyzMultisigSignature123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
