import { Keypair, type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const FEE_PAYER = Keypair.generate().publicKey;
const AUTHORITY = Keypair.generate().publicKey;
const SOURCE = Keypair.generate().publicKey;
const DESTINATION_A = Keypair.generate().publicKey;
const DESTINATION_B = Keypair.generate().publicKey;
const RECEIVER_A = Keypair.generate().publicKey;
const RECEIVER_B = Keypair.generate().publicKey;
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/**
 * Two same-mint USDC transfers chosen to surface the classic float-summation pitfall:
 *   0.1 USDC + 0.2 USDC.
 * With naive float addition this sums to 0.30000000000000004; the receipt total
 * must instead be exactly 0.3 (raw 100_000 + 200_000 = 300_000 base units / 10^6).
 */
export const mockUsdcFpPrecisionTransfersTransaction = {
    blockTime: 1777817015,
    meta: {
        computeUnitsConsumed: 12400,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 2039280, 2039280, 2039280, 1],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: USDC_MINT.toBase58(),
                owner: RECEIVER_A.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '100000', decimals: 6, uiAmount: 0.1, uiAmountString: '0.1' },
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
                mint: USDC_MINT.toBase58(),
                owner: RECEIVER_B.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '200000', decimals: 6, uiAmount: 0.2, uiAmountString: '0.2' },
            },
        ],
        preBalances: [5000, 2039280, 2039280, 2039280, 1],
        preTokenBalances: [],
    },
    slot: 1,
    transaction: {
        message: {
            accountKeys: [
                { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                { pubkey: DESTINATION_A, signer: false, source: 'transaction', writable: true },
                { pubkey: SOURCE, signer: false, source: 'transaction', writable: true },
                { pubkey: DESTINATION_B, signer: false, source: 'transaction', writable: true },
                { pubkey: TOKEN_PROGRAM, signer: false, source: 'transaction', writable: false },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            authority: AUTHORITY.toBase58(),
                            destination: DESTINATION_A.toBase58(),
                            mint: USDC_MINT.toBase58(),
                            source: SOURCE.toBase58(),
                            tokenAmount: { amount: '100000', decimals: 6, uiAmount: 0.1, uiAmountString: '0.1' },
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
                            destination: DESTINATION_B.toBase58(),
                            mint: USDC_MINT.toBase58(),
                            source: SOURCE.toBase58(),
                            tokenAmount: { amount: '200000', decimals: 6, uiAmount: 0.2, uiAmountString: '0.2' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: TOKEN_PROGRAM,
                },
            ],
            recentBlockhash: '6MgFAucojhVLnxc6bfvjpn72bnCoGRA7runiGiRg7xtv',
        },
        signatures: ['mockSignatureForFpPrecisionTransfersTestOnly'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
