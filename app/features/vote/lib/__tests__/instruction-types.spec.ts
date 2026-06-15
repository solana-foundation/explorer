import { gen } from '@__fixtures__/gen';
import { Keypair } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import {
    AuthorizeInfo,
    AuthorizeWithSeedInfo,
    DepositDelegatorRewardsInfo,
    InitializeV2Info,
    TowerSyncInfo,
    UpdateCommissionBpsInfo,
    UpdateCommissionCollectorInfo,
    UpdateValidatorIdentityInfo,
    UpdateVoteStateInfo,
} from '../instruction-types';

// gen.blockhash is a deterministic 32-byte base58 string — the same shape as a vote/tower hash.
const HASH = gen.blockhash();

describe('@features/vote', () => {
    describe('instruction-types: towerSync', () => {
        it('should validate the RPC parsed shape of towersync', () => {
            const voteAccount = randomAddress();

            const parsed = create(
                {
                    towerSync: {
                        blockId: HASH,
                        hash: HASH,
                        lockouts: [
                            { confirmation_count: 31, slot: 414213970 },
                            { confirmation_count: 30, slot: 414213971 },
                        ],
                        root: 414213969,
                        timestamp: 1781015375,
                    },
                    voteAccount,
                    voteAuthority: randomAddress(),
                },
                TowerSyncInfo,
            );

            expect(parsed.voteAccount).toBe(voteAccount);
            expect(parsed.towerSync.lockouts[0].slot).toBe(414213970);
            expect(parsed.towerSync.root).toBe(414213969);
            expect(parsed.hash).toBeUndefined();
        });

        it('should validate towersyncswitch (top-level hash) and null root/timestamp', () => {
            const parsed = create(
                {
                    hash: HASH,
                    towerSync: {
                        blockId: HASH,
                        hash: HASH,
                        lockouts: [],
                        root: null,
                        timestamp: null,
                    },
                    voteAccount: randomAddress(),
                    voteAuthority: randomAddress(),
                },
                TowerSyncInfo,
            );

            expect(parsed.hash).toBe(HASH);
            expect(parsed.towerSync.root).toBeNull();
        });
    });

    describe('instruction-types: updateVoteState', () => {
        it('should validate the RPC parsed shape shared by all updatevotestate variants', () => {
            const parsed = create(
                {
                    voteAccount: randomAddress(),
                    voteAuthority: randomAddress(),
                    voteStateUpdate: {
                        hash: HASH,
                        lockouts: [{ confirmation_count: 12, slot: 250000000 }],
                        root: null,
                        timestamp: 1700000000,
                    },
                },
                UpdateVoteStateInfo,
            );

            expect(parsed.voteStateUpdate.timestamp).toBe(1700000000);
            expect(parsed.voteStateUpdate.lockouts[0].confirmation_count).toBe(12);
        });
    });

    describe('instruction-types: authorityType serde forms', () => {
        it('should accept the string form emitted for unit variants', () => {
            const authority = randomAddress();

            const parsed = create(
                {
                    authority,
                    authorityType: 'Withdrawer',
                    clockSysvar: randomAddress(),
                    newAuthority: randomAddress(),
                    voteAccount: randomAddress(),
                },
                AuthorizeInfo,
            );

            expect(parsed.authorityType).toBe('Withdrawer');
            expect(parsed.authority).toBe(authority);
        });

        it('should reject forms agave never emits (serde serializes unit variants as strings)', () => {
            const info = {
                authority: randomAddress(),
                authorityType: 0,
                clockSysvar: randomAddress(),
                newAuthority: randomAddress(),
                voteAccount: randomAddress(),
            };

            expect(() => create(info, AuthorizeInfo)).toThrow();
            expect(() => create({ ...info, authorityType: 'Staker' }, AuthorizeInfo)).toThrow();
        });

        it('should accept the VoterWithBLS object form (SIMD-0387, authorizeChecked)', () => {
            const parsed = create(
                {
                    authority: randomAddress(),
                    authorityType: {
                        VoterWithBLS: {
                            bls_proof_of_possession: new Array(96).fill(7),
                            bls_pubkey: new Array(48).fill(3),
                        },
                    },
                    clockSysvar: randomAddress(),
                    newAuthority: randomAddress(),
                    voteAccount: randomAddress(),
                },
                AuthorizeInfo,
            );

            expect(typeof parsed.authorityType).toBe('object');
            const blsArgs = (parsed.authorityType as Exclude<typeof parsed.authorityType, number | string>)
                .VoterWithBLS;
            expect(blsArgs.bls_pubkey).toHaveLength(48);
            expect(blsArgs.bls_proof_of_possession).toHaveLength(96);
        });

        it('should validate the seed variants shape', () => {
            const parsed = create(
                {
                    authorityBaseKey: randomAddress(),
                    authorityOwner: randomAddress(),
                    authoritySeed: 'seed',
                    authorityType: 'Voter',
                    clockSysvar: randomAddress(),
                    newAuthority: randomAddress(),
                    voteAccount: randomAddress(),
                },
                AuthorizeWithSeedInfo,
            );

            expect(parsed.authoritySeed).toBe('seed');
        });
    });

    describe('instruction-types: updateValidatorIdentity', () => {
        it('should validate the RPC parsed shape', () => {
            const newValidatorIdentity = randomAddress();

            const parsed = create(
                {
                    newValidatorIdentity,
                    voteAccount: randomAddress(),
                    withdrawAuthority: randomAddress(),
                },
                UpdateValidatorIdentityInfo,
            );

            expect(parsed.newValidatorIdentity).toBe(newValidatorIdentity);
        });
    });

    describe('instruction-types: Alpenglow additions', () => {
        it('should validate initializeV2', () => {
            const parsed = create(
                {
                    authorizedVoter: randomAddress(),
                    authorizedVoterBlsProofOfPossession: 'mOZcyrqpCckPeKVYksZsCInRO6MZc2uc93Hf2Oeb',
                    authorizedVoterBlsPubkey: 'sz/sKhfNFcN7Kcszzomb1fONZjhMClKxVx/L3EHj',
                    authorizedWithdrawer: randomAddress(),
                    blockRevenueCollector: randomAddress(),
                    blockRevenueCommissionBps: 10000,
                    inflationRewardsCollector: randomAddress(),
                    inflationRewardsCommissionBps: 500,
                    node: randomAddress(),
                    voteAccount: randomAddress(),
                },
                InitializeV2Info,
            );

            expect(parsed.inflationRewardsCommissionBps).toBe(500);
        });

        it('should validate updateCommissionBps and reject unknown commission kinds', () => {
            const info = {
                commissionBps: 800,
                commissionKind: 'InflationRewards',
                voteAccount: randomAddress(),
                withdrawAuthority: randomAddress(),
            };

            const parsed = create(info, UpdateCommissionBpsInfo);

            expect(parsed.commissionKind).toBe('InflationRewards');
            expect(() => create({ ...info, commissionKind: 'Other' }, UpdateCommissionBpsInfo)).toThrow();
        });

        it('should validate updateCommissionCollector', () => {
            const newCollector = randomAddress();

            const parsed = create(
                {
                    commissionKind: 'BlockRevenue',
                    newCollector,
                    voteAccount: randomAddress(),
                    withdrawAuthority: randomAddress(),
                },
                UpdateCommissionCollectorInfo,
            );

            expect(parsed.newCollector).toBe(newCollector);
        });

        it('should validate depositDelegatorRewards', () => {
            const parsed = create(
                {
                    deposit: 1000000,
                    source: randomAddress(),
                    voteAccount: randomAddress(),
                },
                DepositDelegatorRewardsInfo,
            );

            expect(parsed.deposit).toBe(1000000);
        });
    });
});

function randomAddress() {
    return Keypair.generate().publicKey.toBase58();
}
