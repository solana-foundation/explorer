import { gen } from '@__fixtures__/gen';
import {
    buildParsedTransaction,
    buildPartiallyDecodedIx,
    buildSolTransferIx,
    buildTokenTransferCheckedIx,
    type ParsedTokenBalance,
} from '@entities/transaction-data/__fixtures__/parsed-transactions';
import { ComputeBudgetProgram, PublicKey, SystemProgram } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

export const SENDER = gen.publicKey(1);
export const RECEIVER = gen.publicKey(2);
export const RECEIVER_2 = gen.publicKey(3);
export const MULTISIG_AUTHORITY = gen.publicKey(4);
const FEE_PAYER = gen.publicKey(5);
const MINT = gen.publicKey(6);
const MINT_2 = gen.publicKey(7);
const SOURCE_TOKEN_ACCOUNT = gen.publicKey(8);
const SOURCE_TOKEN_ACCOUNT_2 = gen.publicKey(9);
const DESTINATION_TOKEN_ACCOUNT = gen.publicKey(10);
const DESTINATION_TOKEN_ACCOUNT_2 = gen.publicKey(11);

const WALLET_HD3F3 = new PublicKey('Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5');
const WALLET_65MUM = new PublicKey('65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk');
const TOKEN_ACCOUNT_HYSC1 = new PublicKey('HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT');
const TOKEN_ACCOUNT_3MRB = new PublicKey('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX');
const DEVNET_USDC = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ADDRESS);
const TOKEN_2022_PROGRAM = new PublicKey(TOKEN_2022_PROGRAM_ADDRESS);
const COMPUTE_BUDGET_PROGRAM = ComputeBudgetProgram.programId;

export const mockSingleTransferTransaction = buildParsedTransaction({
    accountKeys: [SENDER, RECEIVER, SystemProgram.programId],
    blockTime: 1769070902,
    instructions: [buildSolTransferIx({ destination: RECEIVER, lamports: 300000000, source: SENDER })],
});

export const mockMultipleTransfersTransaction = buildParsedTransaction({
    accountKeys: [SENDER, RECEIVER, RECEIVER_2, SystemProgram.programId],
    instructions: [
        buildSolTransferIx({ destination: RECEIVER, lamports: 80000000, source: SENDER }),
        buildSolTransferIx({ destination: RECEIVER_2, lamports: 50000000, source: SENDER }),
        buildSolTransferIx({ destination: RECEIVER, lamports: 10000000, source: SENDER }),
    ],
});

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export const mockNoTransferTransaction = buildParsedTransaction({
    accountKeys: [WALLET_HD3F3, MEMO_PROGRAM],
    blockTime: 1768828236,
    instructions: [{ parsed: 'Payment for invoice #123', program: 'spl-memo', programId: MEMO_PROGRAM }],
});

const WALLET_R1CHH = new PublicKey('R1CHHDEeDwxVxjKv2FPd57mVhbUp4aUQvuE49jYF6Vq');
const JITO_TIP_ADUUK = new PublicKey('ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt');

export const mockJitoOnlyTransferTransaction = buildParsedTransaction({
    accountKeys: [WALLET_R1CHH, JITO_TIP_ADUUK, SystemProgram.programId],
    blockTime: 1770048279,
    instructions: [buildSolTransferIx({ destination: JITO_TIP_ADUUK, lamports: 17343, source: WALLET_R1CHH })],
});

export const mockCustomFeePayerTransaction = buildFeePayerSolTransfer({ blockTime: 1769093093, lamports: 500000000 });

export const mockZeroTransferTransaction = buildFeePayerSolTransfer({ blockTime: 1769142127, lamports: 0 });

function buildFeePayerSolTransfer({ blockTime, lamports }: { blockTime: number; lamports: number }) {
    const feePayer = new PublicKey('644RudhReGpiHsNysSVSpDDagrzw5mBCwdHq1ZNwK6zL');
    const receiver = new PublicKey('G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid');
    return buildParsedTransaction({
        accountKeys: [feePayer, { pubkey: WALLET_HD3F3, signer: true }, receiver, SystemProgram.programId],
        blockTime,
        fee: 10000,
        instructions: [buildSolTransferIx({ destination: receiver, lamports, source: WALLET_HD3F3 })],
    });
}

export const mockUsdcTransferTransaction = buildParsedTransaction({
    accountKeys: [
        WALLET_HD3F3,
        TOKEN_ACCOUNT_HYSC1,
        TOKEN_ACCOUNT_3MRB,
        COMPUTE_BUDGET_PROGRAM,
        SystemProgram.programId,
        TOKEN_PROGRAM,
    ],
    blockTime: 1769070184,
    instructions: [
        buildTokenTransferCheckedIx({
            amount: '1000000',
            authority: WALLET_HD3F3,
            decimals: 6,
            destinationTokenAccount: TOKEN_ACCOUNT_3MRB,
            mint: DEVNET_USDC,
            sourceTokenAccount: TOKEN_ACCOUNT_HYSC1,
        }),
        buildPartiallyDecodedIx({ data: 'KL8Bcb', programId: COMPUTE_BUDGET_PROGRAM }),
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '1000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_65MUM }),
        buildTokenBalance({ accountIndex: 2, amount: '19000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_HD3F3 }),
    ],
});

export const mockUsdcRegularTransferTransaction = buildParsedTransaction({
    accountKeys: [WALLET_HD3F3, TOKEN_ACCOUNT_HYSC1, TOKEN_ACCOUNT_3MRB, TOKEN_PROGRAM],
    blockTime: 1769153097,
    instructions: [
        {
            parsed: {
                info: {
                    amount: '1000000',
                    authority: WALLET_HD3F3.toBase58(),
                    destination: TOKEN_ACCOUNT_3MRB.toBase58(),
                    source: TOKEN_ACCOUNT_HYSC1.toBase58(),
                },
                type: 'transfer',
            },
            program: 'spl-token',
            programId: TOKEN_PROGRAM,
        },
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '2000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_65MUM }),
        buildTokenBalance({ accountIndex: 2, amount: '18000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_HD3F3 }),
    ],
});

const JITO_TIP_96GY = new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5');

export const mockUsdcJitoTransferTransaction = buildParsedTransaction({
    accountKeys: [
        WALLET_HD3F3,
        TOKEN_ACCOUNT_3MRB,
        DEVNET_USDC,
        TOKEN_ACCOUNT_HYSC1,
        JITO_TIP_96GY,
        SystemProgram.programId,
        TOKEN_PROGRAM,
    ],
    blockTime: 1769770869,
    instructions: [
        buildTokenTransferCheckedIx({
            amount: '1000000',
            authority: WALLET_HD3F3,
            decimals: 6,
            destinationTokenAccount: TOKEN_ACCOUNT_3MRB,
            mint: DEVNET_USDC,
            sourceTokenAccount: TOKEN_ACCOUNT_HYSC1,
        }),
        buildSolTransferIx({ destination: JITO_TIP_96GY, lamports: 10000, source: WALLET_HD3F3 }),
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '3000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_65MUM }),
        buildTokenBalance({ accountIndex: 3, amount: '17000000', decimals: 6, mint: DEVNET_USDC, owner: WALLET_HD3F3 }),
    ],
});

const T22_MINT_AN8H = new PublicKey('AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U');
const TOKEN_ACCOUNT_AVU46 = new PublicKey('AvU46uNPpHaPewPwqWNqVLgD9TgQRD8uqFpRRi5PkFDS');
const TOKEN_ACCOUNT_99FC = new PublicKey('99FC9v1Jt7ZDB7fmZtLbYLt7wpYPfVioRy5NJcGrK7ES');
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS);
const T22_AN8H_TOKEN = { decimals: 9, mint: T22_MINT_AN8H, programId: TOKEN_2022_PROGRAM };

export const mockToken2022TransferTransaction = buildParsedTransaction({
    accountKeys: [
        WALLET_HD3F3,
        TOKEN_ACCOUNT_AVU46,
        TOKEN_ACCOUNT_99FC,
        SystemProgram.programId,
        ASSOCIATED_TOKEN_PROGRAM,
        TOKEN_2022_PROGRAM,
        COMPUTE_BUDGET_PROGRAM,
    ],
    blockTime: 1769580206,
    instructions: [
        {
            parsed: { type: 'createIdempotent' },
            program: 'spl-associated-token-account',
            programId: ASSOCIATED_TOKEN_PROGRAM,
        },
        buildTokenTransferCheckedIx({
            amount: '100000000000',
            authority: WALLET_HD3F3,
            decimals: 9,
            destinationTokenAccount: TOKEN_ACCOUNT_AVU46,
            mint: T22_MINT_AN8H,
            sourceTokenAccount: TOKEN_ACCOUNT_99FC,
            tokenProgramId: TOKEN_2022_PROGRAM,
        }),
        buildPartiallyDecodedIx({ data: 'GC3Vaw', programId: COMPUTE_BUDGET_PROGRAM }),
    ],
    postTokenBalances: [
        buildTokenBalance({ ...T22_AN8H_TOKEN, accountIndex: 1, amount: '100000000000', owner: WALLET_65MUM }),
        buildTokenBalance({ ...T22_AN8H_TOKEN, accountIndex: 2, amount: '900000000000', owner: WALLET_HD3F3 }),
    ],
});

const T22_MINT_7XKX = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
const T22_7XKX_TOKEN = { decimals: 0, mint: T22_MINT_7XKX, programId: TOKEN_2022_PROGRAM };
const TOKEN_2022_TRANSFER = buildTokenTransferCheckedIx({
    amount: '100',
    authority: WALLET_HD3F3,
    decimals: 0,
    destinationTokenAccount: TOKEN_ACCOUNT_HYSC1,
    mint: T22_MINT_7XKX,
    sourceTokenAccount: TOKEN_ACCOUNT_3MRB,
    tokenProgramId: TOKEN_2022_PROGRAM,
});

export const mockToken2022Transfer2Transaction = buildParsedTransaction({
    accountKeys: [
        WALLET_HD3F3,
        TOKEN_ACCOUNT_HYSC1,
        TOKEN_ACCOUNT_3MRB,
        COMPUTE_BUDGET_PROGRAM,
        SystemProgram.programId,
        TOKEN_2022_PROGRAM,
    ],
    blockTime: 1769200000,
    instructions: [
        { ...TOKEN_2022_TRANSFER, parsed: { ...TOKEN_2022_TRANSFER.parsed, type: 'transfer2' } },
        buildPartiallyDecodedIx({ data: 'KL8Bcb', programId: COMPUTE_BUDGET_PROGRAM }),
    ],
    postTokenBalances: [
        buildTokenBalance({ ...T22_7XKX_TOKEN, accountIndex: 1, amount: '100', owner: WALLET_65MUM }),
        buildTokenBalance({ ...T22_7XKX_TOKEN, accountIndex: 2, amount: '900', owner: WALLET_HD3F3 }),
    ],
});

export const mockUsdcMultisigTransferTransaction = buildParsedTransaction({
    accountKeys: [SENDER, DESTINATION_TOKEN_ACCOUNT, SOURCE_TOKEN_ACCOUNT, TOKEN_PROGRAM],
    blockTime: 1769070184,
    instructions: [
        {
            parsed: {
                info: {
                    destination: DESTINATION_TOKEN_ACCOUNT.toBase58(),
                    mint: MINT.toBase58(),
                    multisigAuthority: MULTISIG_AUTHORITY.toBase58(),
                    source: SOURCE_TOKEN_ACCOUNT.toBase58(),
                    tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
                },
                type: 'transferChecked',
            },
            program: 'spl-token',
            programId: TOKEN_PROGRAM,
        },
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '1000000', decimals: 6, mint: MINT, owner: RECEIVER }),
        buildTokenBalance({ accountIndex: 2, amount: '19000000', decimals: 6, mint: MINT, owner: SENDER }),
    ],
});

const WALLET_BCDW = new PublicKey('BcdwLA62UPEAvRn7AWauMUXKtYMXxdLzTPaSQg5tNaFc');
const WALLET_C4E3 = new PublicKey('C4E3ZZ4ymQ5wY6o7JkKMeg6Yjj6CQjnaWr6ANvF9mGYY');
const WALLET_96WO = new PublicKey('96WoyH3JmANSMsQLGC3MKyiGiXCymZyM9SLaWjcRrKuD');
const TOKEN_ACCOUNT_7SYA = new PublicKey('7SyaSKPkVFrzAgmBCR64ydpLwcvehkCwJKom8NCF4WGM');
const TOKEN_ACCOUNT_AUJIP = new PublicKey('AUJip4HMnYJD849oU6b8ajGoKuFGoTDfs6s3taDgsb19');
const TOKEN_ACCOUNT_DC1V = new PublicKey('DC1VbwstSDC7LVi4dmWjr5abd5BHucAk29pQTPKrYnbW');

export const mockUsdcMultipleTransfersTransaction = buildParsedTransaction({
    accountKeys: [
        WALLET_BCDW,
        { pubkey: WALLET_C4E3, signer: true },
        TOKEN_ACCOUNT_7SYA,
        TOKEN_ACCOUNT_AUJIP,
        TOKEN_ACCOUNT_DC1V,
        COMPUTE_BUDGET_PROGRAM,
        TOKEN_PROGRAM,
        USDC_MINT,
    ],
    blockTime: 1777817015,
    fee: 10001,
    instructions: [
        buildPartiallyDecodedIx({ data: '3DdGGhkhJbjm', programId: COMPUTE_BUDGET_PROGRAM }),
        buildPartiallyDecodedIx({ data: 'Fj2Eoy', programId: COMPUTE_BUDGET_PROGRAM }),
        buildTokenTransferCheckedIx({
            amount: '1000000',
            authority: WALLET_C4E3,
            decimals: 6,
            destinationTokenAccount: TOKEN_ACCOUNT_DC1V,
            mint: USDC_MINT,
            sourceTokenAccount: TOKEN_ACCOUNT_AUJIP,
        }),
        buildTokenTransferCheckedIx({
            amount: '841',
            authority: WALLET_C4E3,
            decimals: 6,
            destinationTokenAccount: TOKEN_ACCOUNT_7SYA,
            mint: USDC_MINT,
            sourceTokenAccount: TOKEN_ACCOUNT_AUJIP,
        }),
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 2, amount: '2400572', decimals: 6, mint: USDC_MINT, owner: WALLET_BCDW }),
        buildTokenBalance({ accountIndex: 3, amount: '1996478', decimals: 6, mint: USDC_MINT, owner: WALLET_C4E3 }),
        buildTokenBalance({ accountIndex: 4, amount: '6955300', decimals: 6, mint: USDC_MINT, owner: WALLET_96WO }),
    ],
});

export const mockUsdcMultipleTransfersAddresses = {
    authority: WALLET_C4E3.toBase58(),
    mint: USDC_MINT.toBase58(),
    receiver1: WALLET_96WO.toBase58(),
    receiver2: WALLET_BCDW.toBase58(),
} as const;

export const mockMixedMintTransfersTransaction = buildParsedTransaction({
    accountKeys: [
        FEE_PAYER,
        DESTINATION_TOKEN_ACCOUNT,
        SOURCE_TOKEN_ACCOUNT,
        DESTINATION_TOKEN_ACCOUNT_2,
        SOURCE_TOKEN_ACCOUNT_2,
        TOKEN_PROGRAM,
    ],
    blockTime: 1777817015,
    instructions: [
        buildTokenTransferCheckedIx({
            amount: '1000000',
            authority: SENDER,
            decimals: 6,
            destinationTokenAccount: DESTINATION_TOKEN_ACCOUNT,
            mint: MINT,
            sourceTokenAccount: SOURCE_TOKEN_ACCOUNT,
        }),
        buildTokenTransferCheckedIx({
            amount: '500',
            authority: SENDER,
            decimals: 5,
            destinationTokenAccount: DESTINATION_TOKEN_ACCOUNT_2,
            mint: MINT_2,
            sourceTokenAccount: SOURCE_TOKEN_ACCOUNT_2,
        }),
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '1000000', decimals: 6, mint: MINT, owner: RECEIVER }),
        buildTokenBalance({ accountIndex: 2, amount: '0', decimals: 6, mint: MINT, owner: SENDER }),
        buildTokenBalance({ accountIndex: 3, amount: '500', decimals: 5, mint: MINT_2, owner: RECEIVER_2 }),
        buildTokenBalance({ accountIndex: 4, amount: '0', decimals: 5, mint: MINT_2, owner: SENDER }),
    ],
});

export const mockUsdcFpPrecisionTransfersTransaction = buildParsedTransaction({
    accountKeys: [
        FEE_PAYER,
        DESTINATION_TOKEN_ACCOUNT,
        SOURCE_TOKEN_ACCOUNT,
        DESTINATION_TOKEN_ACCOUNT_2,
        TOKEN_PROGRAM,
    ],
    blockTime: 1777817015,
    instructions: [
        buildTokenTransferCheckedIx({
            amount: '100000',
            authority: SENDER,
            decimals: 6,
            destinationTokenAccount: DESTINATION_TOKEN_ACCOUNT,
            mint: USDC_MINT,
            sourceTokenAccount: SOURCE_TOKEN_ACCOUNT,
        }),
        buildTokenTransferCheckedIx({
            amount: '200000',
            authority: SENDER,
            decimals: 6,
            destinationTokenAccount: DESTINATION_TOKEN_ACCOUNT_2,
            mint: USDC_MINT,
            sourceTokenAccount: SOURCE_TOKEN_ACCOUNT,
        }),
    ],
    postTokenBalances: [
        buildTokenBalance({ accountIndex: 1, amount: '100000', decimals: 6, mint: USDC_MINT, owner: RECEIVER }),
        buildTokenBalance({ accountIndex: 2, amount: '0', decimals: 6, mint: USDC_MINT, owner: SENDER }),
        buildTokenBalance({ accountIndex: 3, amount: '200000', decimals: 6, mint: USDC_MINT, owner: RECEIVER_2 }),
    ],
});

function buildTokenBalance({
    accountIndex,
    amount,
    decimals,
    mint,
    owner,
    programId = TOKEN_PROGRAM,
}: {
    accountIndex: number;
    amount: string;
    decimals: number;
    mint: PublicKey;
    owner: PublicKey;
    programId?: PublicKey;
}): ParsedTokenBalance {
    const uiAmount = Number(amount) / 10 ** decimals;
    return {
        accountIndex,
        mint: mint.toBase58(),
        owner: owner.toBase58(),
        programId: programId.toBase58(),
        uiTokenAmount: { amount, decimals, uiAmount, uiAmountString: String(uiAmount) },
    };
}
