import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a transaction with no transfers (memo only).
 * - Memo: "Payment for invoice #123"
 * - No SOL transfers
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 */
export const mockNoTransferTransaction = {
    blockTime: 1768828236,
    meta: {
        computeUnitsConsumed: 23208,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]',
            'Program log: Signed by Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
            'Program log: Memo (len 24): "Payment for invoice #123"',
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 23208 of 200000 compute units',
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success',
        ],
        postBalances: [50741144451, 1055598881],
        postTokenBalances: [],
        preBalances: [50741149451, 1055598881],
        preTokenBalances: [],
    },
    slot: 436219969,
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
                    pubkey: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            instructions: [
                {
                    parsed: 'Payment for invoice #123',
                    program: 'spl-memo',
                    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                },
            ],
            recentBlockhash: '2cCRgF4ZSNTCTTZEvPCwpjMmiMrTibXUnKtCUhwJypgW',
        },
        signatures: ['5aVj7exPmdLLQyzMo4FMHQEkoRzheXKVBStvZLuZb1xE2vKhqoxup41bzDtp7Xc5N4gRGGqQofJ4Rt1eyKiJTTK8'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
