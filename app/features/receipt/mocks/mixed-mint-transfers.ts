import { Keypair, type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const FEE_PAYER = Keypair.generate().publicKey;
const AUTHORITY = Keypair.generate().publicKey;
const SOURCE_USDC = Keypair.generate().publicKey;
const SOURCE_BONK = Keypair.generate().publicKey;
const DESTINATION_USDC = Keypair.generate().publicKey;
const DESTINATION_BONK = Keypair.generate().publicKey;
const RECEIVER_USDC = Keypair.generate().publicKey;
const RECEIVER_BONK = Keypair.generate().publicKey;
const USDC_MINT = Keypair.generate().publicKey;
const BONK_MINT = Keypair.generate().publicKey;
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/**
 * Mock transaction containing two token transfers of distinct mints.
 * Used to verify the receipt pipeline rejects mixed-mint transactions and
 * exposes a "mixed-mint" reason to the UI.
 */
export const mockMixedMintTransfersTransaction = {
    blockTime: 1777817015,
    meta: {
        computeUnitsConsumed: 12700,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 2039280, 2039280, 2039280, 2039280, 1],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: USDC_MINT.toBase58(),
                owner: RECEIVER_USDC.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
            {
                accountIndex: 2,
                mint: USDC_MINT.toBase58(),
                owner: AUTHORITY.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '0', decimals: 6, uiAmount: null, uiAmountString: '0' },
            },
            {
                accountIndex: 3,
                mint: BONK_MINT.toBase58(),
                owner: RECEIVER_BONK.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '500', decimals: 5, uiAmount: 0.005, uiAmountString: '0.005' },
            },
            {
                accountIndex: 4,
                mint: BONK_MINT.toBase58(),
                owner: AUTHORITY.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '0', decimals: 5, uiAmount: null, uiAmountString: '0' },
            },
        ],
        preBalances: [5000, 2039280, 2039280, 2039280, 2039280, 1],
        preTokenBalances: [],
    },
    slot: 1,
    transaction: {
        message: {
            accountKeys: [
                { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                { pubkey: DESTINATION_USDC, signer: false, source: 'transaction', writable: true },
                { pubkey: SOURCE_USDC, signer: false, source: 'transaction', writable: true },
                { pubkey: DESTINATION_BONK, signer: false, source: 'transaction', writable: true },
                { pubkey: SOURCE_BONK, signer: false, source: 'transaction', writable: true },
                { pubkey: TOKEN_PROGRAM, signer: false, source: 'transaction', writable: false },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            authority: AUTHORITY.toBase58(),
                            destination: DESTINATION_USDC.toBase58(),
                            mint: USDC_MINT.toBase58(),
                            source: SOURCE_USDC.toBase58(),
                            tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: TOKEN_PROGRAM,
                },
                {
                    parsed: {
                        info: {
                            authority: AUTHORITY.toBase58(),
                            destination: DESTINATION_BONK.toBase58(),
                            mint: BONK_MINT.toBase58(),
                            source: SOURCE_BONK.toBase58(),
                            tokenAmount: { amount: '500', decimals: 5, uiAmount: 0.005, uiAmountString: '0.005' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: TOKEN_PROGRAM,
                },
            ],
            recentBlockhash: '6MgFAucojhVLnxc6bfvjpn72bnCoGRA7runiGiRg7xtv',
        },
        signatures: ['mockSignatureForMixedMintTransfersTestOnly'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
