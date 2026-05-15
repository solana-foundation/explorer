import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { ComputeBudgetProgram, type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const FEE_PAYER = new PublicKey('BcdwLA62UPEAvRn7AWauMUXKtYMXxdLzTPaSQg5tNaFc');
const AUTHORITY = new PublicKey('C4E3ZZ4ymQ5wY6o7JkKMeg6Yjj6CQjnaWr6ANvF9mGYY');
const DESTINATION_TOKEN_ACCOUNT_2 = new PublicKey('7SyaSKPkVFrzAgmBCR64ydpLwcvehkCwJKom8NCF4WGM');
const SOURCE_TOKEN_ACCOUNT = new PublicKey('AUJip4HMnYJD849oU6b8ajGoKuFGoTDfs6s3taDgsb19');
const DESTINATION_TOKEN_ACCOUNT_1 = new PublicKey('DC1VbwstSDC7LVi4dmWjr5abd5BHucAk29pQTPKrYnbW');
const RECEIVER_1 = new PublicKey('96WoyH3JmANSMsQLGC3MKyiGiXCymZyM9SLaWjcRrKuD');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const COMPUTE_BUDGET = ComputeBudgetProgram.programId;
const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;

/**
 * Mock transaction data captured from mainnet signature
 * 4rygbUwG9nN8hKMzMpz5yrgquZWsn2ES2gEfCK1Tzm2seSgRtssVfiKQvo4SnSELybdJWscD8ZPB6zJ4aSWJA6qc.
 *
 * Two USDC `transferChecked` instructions sharing the same source token account
 * (AUJip4H…) and authority (C4E3ZZ4…):
 *   1. 1 USDC      → DC1Vbws…  (owner 96WoyH3J…)
 *   2. 0.000841 USDC → 7SyaSKP… (owner BcdwLA62…, also the fee payer)
 * Plus two ComputeBudget instructions (price + limit), no inner instructions.
 */
export const mockUsdcMultipleTransfersTransaction = {
    blockTime: 1777817015,
    meta: {
        computeUnitsConsumed: 12700,
        costUnits: 15388,
        err: null,
        fee: 10001,
        innerInstructions: [],
        logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 199700 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 193500 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        ],
        postBalances: [46449694, 0, 2039280, 2039280, 2039280, 1, 5677904863, 497087412985],
        postTokenBalances: [
            {
                accountIndex: 2,
                mint: USDC_MINT.toBase58(),
                owner: FEE_PAYER.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '2400572', decimals: 6, uiAmount: 2.400572, uiAmountString: '2.400572' },
            },
            {
                accountIndex: 3,
                mint: USDC_MINT.toBase58(),
                owner: AUTHORITY.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '1996478', decimals: 6, uiAmount: 1.996478, uiAmountString: '1.996478' },
            },
            {
                accountIndex: 4,
                mint: USDC_MINT.toBase58(),
                owner: RECEIVER_1.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '6955300', decimals: 6, uiAmount: 6.9553, uiAmountString: '6.9553' },
            },
        ],
        preBalances: [46459695, 0, 2039280, 2039280, 2039280, 1, 5677904863, 497087412985],
        preTokenBalances: [
            {
                accountIndex: 2,
                mint: USDC_MINT.toBase58(),
                owner: FEE_PAYER.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '2399731', decimals: 6, uiAmount: 2.399731, uiAmountString: '2.399731' },
            },
            {
                accountIndex: 3,
                mint: USDC_MINT.toBase58(),
                owner: AUTHORITY.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '2997319', decimals: 6, uiAmount: 2.997319, uiAmountString: '2.997319' },
            },
            {
                accountIndex: 4,
                mint: USDC_MINT.toBase58(),
                owner: RECEIVER_1.toBase58(),
                programId: TOKEN_PROGRAM.toBase58(),
                uiTokenAmount: { amount: '5955300', decimals: 6, uiAmount: 5.9553, uiAmountString: '5.9553' },
            },
        ],
    },
    slot: 417327753,
    transaction: {
        message: {
            accountKeys: [
                { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                { pubkey: AUTHORITY, signer: true, source: 'transaction', writable: false },
                { pubkey: DESTINATION_TOKEN_ACCOUNT_2, signer: false, source: 'transaction', writable: true },
                { pubkey: SOURCE_TOKEN_ACCOUNT, signer: false, source: 'transaction', writable: true },
                { pubkey: DESTINATION_TOKEN_ACCOUNT_1, signer: false, source: 'transaction', writable: true },
                { pubkey: COMPUTE_BUDGET, signer: false, source: 'transaction', writable: false },
                { pubkey: TOKEN_PROGRAM, signer: false, source: 'transaction', writable: false },
                { pubkey: USDC_MINT, signer: false, source: 'transaction', writable: false },
            ],
            instructions: [
                { accounts: [], data: '3DdGGhkhJbjm', programId: COMPUTE_BUDGET },
                { accounts: [], data: 'Fj2Eoy', programId: COMPUTE_BUDGET },
                {
                    parsed: {
                        info: {
                            authority: AUTHORITY.toBase58(),
                            destination: DESTINATION_TOKEN_ACCOUNT_1.toBase58(),
                            mint: USDC_MINT.toBase58(),
                            source: SOURCE_TOKEN_ACCOUNT.toBase58(),
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
                            destination: DESTINATION_TOKEN_ACCOUNT_2.toBase58(),
                            mint: USDC_MINT.toBase58(),
                            source: SOURCE_TOKEN_ACCOUNT.toBase58(),
                            tokenAmount: { amount: '841', decimals: 6, uiAmount: 0.000841, uiAmountString: '0.000841' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: TOKEN_PROGRAM,
                },
            ],
            recentBlockhash: 'B4jEXExD3PdCfnmpmUGt1vUrRx2qA4K7zDhAejkZyGe5',
        },
        signatures: [
            '4rygbUwG9nN8hKMzMpz5yrgquZWsn2ES2gEfCK1Tzm2seSgRtssVfiKQvo4SnSELybdJWscD8ZPB6zJ4aSWJA6qc',
            '3p4ocQfLHCtXQ4VzA2hJkHkeuP8sCJumvx4hobidyhuq5qV48g7CVqcHtbipjSAs2rke5fkLHruskTTJz2SuqZwd',
        ],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;

// Help tests assert on the same addresses the mock embeds.
export const mockUsdcMultipleTransfersAddresses = {
    authority: AUTHORITY.toBase58(),
    feePayer: FEE_PAYER.toBase58(),
    mint: USDC_MINT.toBase58(),
    receiver1: RECEIVER_1.toBase58(),
    receiver2: FEE_PAYER.toBase58(),
} as const;
