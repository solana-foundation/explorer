import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import {
    type ParsedInnerInstruction,
    type ParsedInstruction,
    type ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

const SYSTEM_PROGRAM = SystemProgram.programId;
const TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ADDRESS);

const DEFAULT_BLOCKHASH = 'AHK7TnmvzPAk4WsmWqVgL7v6YccGkANoWUmrSY7aQDzw';

export function buildSolTransferIx(opts: {
    source: PublicKey;
    destination: PublicKey;
    lamports: number;
}): ParsedInstruction {
    return {
        parsed: {
            info: {
                destination: opts.destination.toBase58(),
                lamports: opts.lamports,
                source: opts.source.toBase58(),
            },
            type: 'transfer',
        },
        program: 'system',
        programId: SYSTEM_PROGRAM,
    };
}

export function buildSolTransferWithSeedIx(opts: {
    source: PublicKey;
    sourceBase: PublicKey;
    sourceSeed: string;
    sourceOwner: PublicKey;
    destination: PublicKey;
    lamports: number;
}): ParsedInstruction {
    return {
        parsed: {
            info: {
                destination: opts.destination.toBase58(),
                lamports: opts.lamports,
                source: opts.source.toBase58(),
                sourceBase: opts.sourceBase.toBase58(),
                sourceOwner: opts.sourceOwner.toBase58(),
                sourceSeed: opts.sourceSeed,
            },
            type: 'transferWithSeed',
        },
        program: 'system',
        programId: SYSTEM_PROGRAM,
    };
}

export function buildTokenTransferCheckedIx(opts: {
    authority: PublicKey;
    sourceTokenAccount: PublicKey;
    destinationTokenAccount: PublicKey;
    mint: PublicKey;
    amount: string;
    decimals: number;
    tokenProgramId?: PublicKey;
}): ParsedInstruction {
    const uiAmount = Number(opts.amount) / Math.pow(10, opts.decimals);
    return {
        parsed: {
            info: {
                authority: opts.authority.toBase58(),
                destination: opts.destinationTokenAccount.toBase58(),
                mint: opts.mint.toBase58(),
                source: opts.sourceTokenAccount.toBase58(),
                tokenAmount: {
                    amount: opts.amount,
                    decimals: opts.decimals,
                    uiAmount,
                    uiAmountString: String(uiAmount),
                },
            },
            type: 'transferChecked',
        },
        program: 'spl-token',
        programId: opts.tokenProgramId ?? TOKEN_PROGRAM,
    };
}

export function buildPartiallyDecodedIx(opts: {
    programId: PublicKey;
    accounts?: PublicKey[];
    data?: string;
}): PartiallyDecodedInstruction {
    return {
        accounts: opts.accounts ?? [],
        data: opts.data ?? '',
        programId: opts.programId,
    };
}

export function buildInnerGroup(index: number, instructions: ParsedInstruction[]): ParsedInnerInstruction {
    return { index, instructions };
}

export type ParsedTokenBalance = {
    accountIndex: number;
    mint: string;
    owner: string;
    programId: string;
    uiTokenAmount: { amount: string; decimals: number; uiAmount: number; uiAmountString: string };
};

export function buildParsedTransaction(opts: {
    accountKeys: PublicKey[];
    instructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
    innerInstructions?: ParsedInnerInstruction[];
    postTokenBalances?: ParsedTokenBalance[];
    fee?: number;
    blockTime?: number;
}): ParsedTransactionWithMeta {
    return {
        blockTime: opts.blockTime ?? 1768831450,
        meta: {
            computeUnitsConsumed: 1200,
            err: null,
            fee: opts.fee ?? 5000,
            innerInstructions: opts.innerInstructions ?? [],
            logMessages: [],
            postBalances: opts.accountKeys.map(() => 0),
            postTokenBalances: opts.postTokenBalances ?? [],
            preBalances: opts.accountKeys.map(() => 0),
            preTokenBalances: opts.postTokenBalances ?? [],
        },
        slot: 436228237,
        transaction: {
            message: {
                accountKeys: opts.accountKeys.map((pubkey, i) => ({
                    pubkey,
                    signer: i === 0,
                    source: 'transaction',
                    writable: true,
                })),
                instructions: opts.instructions,
                recentBlockhash: DEFAULT_BLOCKHASH,
            },
            signatures: [DEFAULT_SIGNATURE],
        },
        version: 'legacy',
    } satisfies ParsedTransactionWithMeta;
}
