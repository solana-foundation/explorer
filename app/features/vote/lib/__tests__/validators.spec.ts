import { Keypair, PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { VoteAccount } from '../validators';

describe('@features/vote', () => {
    describe('validators: vote account', () => {
        it('should validate the pre-v4 UiVoteState shape (old account decoders)', () => {
            const parsed = create({ info: legacyVoteStateInfo(), type: 'vote' }, VoteAccount);

            expect(parsed.type).toBe('vote');
            expect(parsed.info.nodePubkey).toBeInstanceOf(PublicKey);
            expect(parsed.info.votes[0].latency).toBeUndefined();
            expect(parsed.info.inflationRewardsCommissionBps).toBeUndefined();
        });

        it('should validate the vote state v4 UiVoteState shape (SIMD-0185)', () => {
            const info = {
                ...legacyVoteStateInfo(),
                blockRevenueCollector: randomAddress(),
                blockRevenueCommissionBps: 10000,
                blsPubkeyCompressed: '7aW7878L1Y6fUvksMbqxP9AsEikWFtapXEdaspUkuHPdkDgDyLrkBHhG7J34zQPXhX',
                inflationRewardsCollector: randomAddress(),
                inflationRewardsCommissionBps: 500,
                pendingDelegatorRewards: '0',
                priorVoters: [],
                votes: [{ confirmationCount: 31, latency: 1, slot: 414609628 }],
            };

            const parsed = create({ info, type: 'vote' }, VoteAccount);

            expect(parsed.info.votes[0].latency).toBe(1);
            expect(parsed.info.inflationRewardsCommissionBps).toBe(500);
            expect(parsed.info.blockRevenueCollector).toBeInstanceOf(PublicKey);
            expect(parsed.info.pendingDelegatorRewards).toBe('0');
        });

        it('should accept a null blsPubkeyCompressed (Option::None serializes as null)', () => {
            const info = { ...legacyVoteStateInfo(), blsPubkeyCompressed: null };

            const parsed = create({ info, type: 'vote' }, VoteAccount);

            expect(parsed.info.blsPubkeyCompressed).toBeNull();
        });

        it('should accept a null rootSlot', () => {
            const info = { ...legacyVoteStateInfo(), rootSlot: null };

            const parsed = create({ info, type: 'vote' }, VoteAccount);

            expect(parsed.info.rootSlot).toBeNull();
        });
    });
});

// Field set emitted by nodes running pre-v4 account decoders (e.g. agave 2.1):
// no `latency` on votes, no SIMD-0185 fields.
function legacyVoteStateInfo() {
    return {
        authorizedVoters: [{ authorizedVoter: randomAddress(), epoch: 700 }],
        authorizedWithdrawer: randomAddress(),
        commission: 5,
        epochCredits: [{ credits: '312779361', epoch: 909, previousCredits: '308098589' }],
        lastTimestamp: { slot: 414609658, timestamp: 1781166633 },
        nodePubkey: randomAddress(),
        priorVoters: [{ authorizedPubkey: randomAddress(), epochOfLastAuthorizedSwitch: 650, targetEpoch: 651 }],
        rootSlot: 414609627,
        votes: [{ confirmationCount: 31, slot: 414609628 }],
    };
}

function randomAddress() {
    return Keypair.generate().publicKey.toBase58();
}
