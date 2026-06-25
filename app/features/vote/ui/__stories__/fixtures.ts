import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import type { ParsedInstruction, ParsedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { VOTE_PROGRAM_ADDRESS } from '../../lib/constants';
import type { Vote, VoteAccount } from '../../lib/validators';

export const BASE_SLOT = Number(gen.slot(0));

// Real testnet addresses/hashes so fixtures look authentic and stay pixel-stable.
export const VOTE_ACCOUNT_ADDRESS = 'FMYmiwty1hMicTqzLqp4USvrjtqhsPhocquaUYMZsbPo';
export const VOTE_AUTHORITY_ADDRESS = 'Bdjmn2pTy6q7xZ5cHsCxZSCjdW2tUU86ZzwgjU9qsYKQ';
export const CLOCK_SYSVAR_ADDRESS = 'SysvarC1ock11111111111111111111111111111111';
export const SLOT_HASHES_SYSVAR_ADDRESS = 'SysvarS1otHashes111111111111111111111111111';
export const RENT_SYSVAR_ADDRESS = 'SysvarRent111111111111111111111111111111111';
export const HASH = 'EGmiq6yYZJyZHpUcXc7yFXG4SQB6oPCxYS8L2Hxb1tNe';
export const TIMESTAMP = 1781015375;

export function accountFixture(): Account {
    return {
        data: {},
        executable: false,
        lamports: 339_941_212_781,
        owner: toLegacyPublicKey(VOTE_PROGRAM_ADDRESS),
        pubkey: new PublicKey(VOTE_ACCOUNT_ADDRESS),
        space: 3762,
    };
}

export function voteAccountFixture(votes: Vote[]): VoteAccount {
    return {
        info: {
            authorizedVoters: [{ authorizedVoter: storyPubkey(1), epoch: 700 }],
            authorizedWithdrawer: storyPubkey(2),
            commission: 5,
            epochCredits: [{ credits: '312779361', epoch: 700, previousCredits: '308098589' }],
            lastTimestamp: { slot: BASE_SLOT, timestamp: 1781166633 },
            nodePubkey: storyPubkey(3),
            priorVoters: [],
            rootSlot: BASE_SLOT - 1,
            votes,
        },
        type: 'vote',
    };
}

// Vote state v4 (SIMD-0185) variant: landed-vote latency plus the bps/collector fields.
export function voteAccountV4Fixture(votes: Vote[]): VoteAccount {
    const base = voteAccountFixture(votes.map(vote => ({ ...vote, latency: 1 })));
    return {
        ...base,
        info: {
            ...base.info,
            blockRevenueCollector: storyPubkey(4),
            blockRevenueCommissionBps: 10000,
            blsPubkeyCompressed: '7aW7878L1Y6fUvksMbqxP9AsEikWFtapXEdaspUkuHPdkDgDyLrkBHhG7J34zQPXhX',
            inflationRewardsCollector: new PublicKey(VOTE_ACCOUNT_ADDRESS),
            inflationRewardsCommissionBps: 500,
            pendingDelegatorRewards: '1500000000',
        },
    };
}

export function voteParsedInstruction(parsed: { info: object; type: string }): ParsedInstruction {
    return {
        parsed,
        program: 'vote',
        programId: toLegacyPublicKey(VOTE_PROGRAM_ADDRESS),
    };
}

export function voteParsedTransaction(ix: ParsedInstruction): ParsedTransaction {
    return {
        message: {
            accountKeys: [
                { pubkey: new PublicKey(VOTE_AUTHORITY_ADDRESS), signer: true, source: 'transaction', writable: true },
                { pubkey: new PublicKey(VOTE_ACCOUNT_ADDRESS), signer: false, source: 'transaction', writable: true },
                { pubkey: new PublicKey(CLOCK_SYSVAR_ADDRESS), signer: false, source: 'transaction', writable: false },
                {
                    pubkey: toLegacyPublicKey(VOTE_PROGRAM_ADDRESS),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            instructions: [ix],
            recentBlockhash: HASH,
        },
        signatures: ['3fEi7sku5kEgeZmLw9evxY5if9TsFyxpUNsi84J3s1bAeQmKSAhBypuxgprSs15MYBmvvTCnVwoN36rCaoqq6oHd'],
    };
}

// gen.blockhash is a deterministic 32-byte base58 string, which is exactly a valid
// pubkey — seeded so story fixtures stay pixel-stable.
function storyPubkey(seed: number): PublicKey {
    return new PublicKey(gen.blockhash(seed));
}
