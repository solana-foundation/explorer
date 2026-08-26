import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import { createWeb3TransactionBytes } from '@entities/transaction-data/__fixtures__/wire-transactions';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { PublicKey, SystemProgram, TransactionMessage, VersionedMessage } from '@solana/web3.js';
import {
    mockParsedTransactionDetails,
    mockRawTransactionDetails,
    mockTransactionStatus,
} from '@storybook-config/__fixtures__/transactions';

import { parseTransactionBytes } from '@/app/shared/lib/parse-transaction-bytes';

export { DEFAULT_SIGNATURE };

export const FEE_PAYER = new PublicKey('9noXzpXnkyEcKF3AeXqUHTdR59V5uvrRBUZ9bwfQwxNq');
export const RECIPIENT = new PublicKey('GsbwXfJraMomNxBcpR3DBr9yoWR2PmN93PEaYJz7MSTN');
export const TOKEN_ACCOUNT = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export const MOCK_STATUS = mockTransactionStatus();
export const MOCK_FAILED_STATUS = mockTransactionStatus({ err: { InstructionError: [0, 'GenericError'] } });

const BASE_TX = {
    blockTime: 1_716_000_000,
    meta: {
        computeUnitsConsumed: 5000,
        // The cost model's total for a single-signer SOL transfer, as mainnet reports it.
        costUnits: 1481,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program log: Transfer of 1 SOL',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [999_990_000, 1_001_000_000, 1_000_000_000, 1],
        postTokenBalances: [
            {
                accountIndex: 2,
                mint: TOKEN_MINT.toBase58(),
                owner: RECIPIENT.toBase58(),
                programId: TOKEN_ACCOUNT.toBase58(),
                uiTokenAmount: {
                    amount: '1500000',
                    decimals: 6,
                    uiAmount: 1.5,
                    uiAmountString: '1.5',
                },
            },
        ],
        preBalances: [1_000_000_000, 0, 1_000_000_000, 1],
        preTokenBalances: [
            {
                accountIndex: 2,
                mint: TOKEN_MINT.toBase58(),
                owner: RECIPIENT.toBase58(),
                programId: TOKEN_ACCOUNT.toBase58(),
                uiTokenAmount: {
                    amount: '500000',
                    decimals: 6,
                    uiAmount: 0.5,
                    uiAmountString: '0.5',
                },
            },
        ],
        rewards: [],
    },
    slot: 312_456_789,
    transaction: {
        message: {
            accountKeys: [
                { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                { pubkey: RECIPIENT, signer: false, source: 'transaction', writable: true },
                { pubkey: TOKEN_ACCOUNT, signer: false, source: 'transaction', writable: true },
                {
                    pubkey: new PublicKey(SystemProgram.programId),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            addressTableLookups: [],
            instructions: [
                {
                    parsed: {
                        info: {
                            destination: RECIPIENT.toBase58(),
                            lamports: 1_000_000_000,
                            source: FEE_PAYER.toBase58(),
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey(SystemProgram.programId),
                    stackHeight: null,
                },
            ],
            recentBlockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
        },
        signatures: [DEFAULT_SIGNATURE],
    },
    version: 'legacy',
} as unknown as ParsedTransactionWithMeta;

export const MOCK_PARSED_TX = mockParsedTransactionDetails({ transactionWithMeta: BASE_TX });

/**
 * A transaction that left a wallet's default 200,000 compute unit request in place. Its requested
 * cost units — and so its projected SIMD-0553 fee — dwarf what it actually paid.
 */
export const MOCK_OVER_REQUESTED_CU_TX = mockParsedTransactionDetails({
    transactionWithMeta: {
        ...BASE_TX,
        meta: {
            ...BASE_TX.meta,
            costUnits: 201_481,
        } as unknown as ParsedTransactionWithMeta['meta'],
    },
});

export const MOCK_FAILED_TX = mockParsedTransactionDetails({
    transactionWithMeta: {
        ...BASE_TX,
        meta: {
            ...BASE_TX.meta,
            err: { InstructionError: [0, 'GenericError'] },
            logMessages: [
                'Program 11111111111111111111111111111111 invoke [1]',
                'Program log: insufficient funds',
                'Program 11111111111111111111111111111111 failed: custom program error: 0x1',
            ],
        } as unknown as ParsedTransactionWithMeta['meta'],
    },
});

// Built from real wire bytes rather than a hand-picked number, so the size the summary renders is
// the size these bytes actually have.
const RAW_TX_BYTES = createWeb3TransactionBytes('legacy');
const RAW_MESSAGE_BYTES = parseTransactionBytes(RAW_TX_BYTES).messageBytes;
const RAW_MESSAGE = VersionedMessage.deserialize(RAW_MESSAGE_BYTES);

export const MOCK_RAW_TX = mockRawTransactionDetails({
    raw: {
        message: RAW_MESSAGE,
        messageBytes: RAW_MESSAGE_BYTES,
        serializedSize: RAW_TX_BYTES.length,
        signatures: [DEFAULT_SIGNATURE],
        transaction: TransactionMessage.decompile(RAW_MESSAGE),
        version: 'legacy',
    },
});

export const MOCK_NO_LOGS_TX = mockParsedTransactionDetails({
    transactionWithMeta: {
        ...BASE_TX,
        meta: { ...BASE_TX.meta, logMessages: null } as unknown as ParsedTransactionWithMeta['meta'],
    },
});
