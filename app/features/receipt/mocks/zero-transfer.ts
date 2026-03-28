import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a zero SOL transfer.
 * - Transfer 0 SOL (0 lamports) from Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - To: G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid
 * - Fee payer: 644RudhReGpiHsNysSVSpDDagrzw5mBCwdHq1ZNwK6zL (pays 10,000 lamports fee)
 * - This represents a transaction with a transfer instruction but zero lamports
 *
 * This transaction has 2 signers: the fee payer and the sender.
 */
export const mockZeroTransferTransaction = {
    blockTime: 1769142127,
    meta: {
        computeUnitsConsumed: 150,
        costUnits: 2501,
        err: null,
        fee: 10000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [449960000, 69079299131, 1090000000, 1],
        postTokenBalances: [],
        preBalances: [449970000, 69079299131, 1090000000, 1],
        preTokenBalances: [],
    },
    slot: 437032620,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: new PublicKey('644RudhReGpiHsNysSVSpDDagrzw5mBCwdHq1ZNwK6zL'),
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5'),
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid'),
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
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            destination: 'G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid',
                            lamports: 0,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: '4115TKZYjN5LSvcyQneUfocYYq6oPzzNRNbFQaP1HugH',
        },
        signatures: [
            '22xruGxWMALDoVksikb6kyv7wigrqQSEtmM8pbazAjmM3uSnvugvXhcmGhFhWd9uuUJDsegfddznFPC9f5Qpx8cq',
            '3EccbwavfrdLFxK6j9bhFxWSLE4HnzM1u4VwuYdTrMrKSmyoZzvx8kYjuyPBVANdBoDqew9o8dxzp1J2p3CMb22w',
        ],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
