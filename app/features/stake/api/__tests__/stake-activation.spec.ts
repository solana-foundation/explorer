import { type Address, address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { getStakeActivation, type StakeActivationRpc } from '../stake-activation';

const STAKE_ACCOUNT_ADDRESS = address('11111111111111111111111111111111');
const STAKE_HISTORY_ADDRESS = 'SysvarStakeHistory1111111111111111111111111';
// Sentinel deactivation epoch used on chain for stake that has never been deactivated.
const NEVER_DEACTIVATED = 18446744073709551615n;

describe('getStakeActivation', () => {
    describe('error handling', () => {
        it('should throw when the stake account is not found', async () => {
            const rpc = buildRpc({ epoch: 100n, stakeAccount: null, stakeHistory: [] });
            await expect(getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS)).rejects.toThrow('Account not found');
        });

        it('should throw when the stake history sysvar is not found', async () => {
            const rpc = buildRpc({
                epoch: 100n,
                stakeAccount: delegatedStakeFixture(),
                stakeHistory: null,
            });
            await expect(getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS)).rejects.toThrow('StakeHistory not found');
        });

        it('should throw when the stake account is not delegated', async () => {
            const rpc = buildRpc({
                epoch: 100n,
                stakeAccount: { kind: 'initialized' },
                stakeHistory: [],
            });
            await expect(getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS)).rejects.toThrow('not delegated');
        });
    });

    // These pipeline tests cover each branch of deriveStatus. Per-branch math edges live in
    // lib/__tests__/stake-activation-math.spec.ts; these only verify status derivation +
    // lamports/rent arithmetic + JSON parsing wire together for each status string.

    it('should derive "activating" status one epoch after activation', async () => {
        // One epoch after activation, the cluster's 9% warmup cap applies.
        // newlyEffective = (remaining / activating) * (effective * 0.09)
        //                = (100M / 100M) * (1B * 0.09)
        //                = 90M
        const rpc = buildRpc({
            epoch: 11n,
            stakeAccount: delegatedStakeFixture({
                activationEpoch: 10n,
                lamports: 100_002_282_880n,
                stake: 100_000_000n,
            }),
            stakeHistory: [{ activating: 100_000_000n, deactivating: 0n, effective: 1_000_000_000n, epoch: 10n }],
        });
        const result = await getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS);
        expect(result.status).toBe('activating');
        expect(result.active).toBe(90_000_000n);
        // lamports (100_002_282_880) - active (90_000_000) - rentReserve (2_282_880)
        expect(result.inactive).toBe(99_910_000_000n);
    });

    it('should derive "active" status for a fully warmed delegation', async () => {
        // Empty history at a target epoch past activation → "dropped out of history" branch
        // returns the full delegated stake as effective.
        const rpc = buildRpc({
            epoch: 100n,
            stakeAccount: delegatedStakeFixture(),
            stakeHistory: [],
        });
        const result = await getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS);
        expect(result.status).toBe('active');
        expect(result.active).toBe(1_000_000n);
        expect(result.inactive).toBe(0n);
    });

    it('should derive "deactivating" status at the deactivation epoch', async () => {
        // At target == deactivationEpoch, all effective stake is reported as deactivating.
        const rpc = buildRpc({
            epoch: 50n,
            stakeAccount: delegatedStakeFixture({ deactivationEpoch: 50n }),
            stakeHistory: [],
        });
        const result = await getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS);
        expect(result.status).toBe('deactivating');
        expect(result.active).toBe(1_000_000n);
        expect(result.inactive).toBe(0n);
    });

    it('should derive "inactive" status for a fully decayed delegation', async () => {
        // Target far past deactivation with no history entry → math returns all zeros.
        const rpc = buildRpc({
            epoch: 100n,
            stakeAccount: delegatedStakeFixture({ deactivationEpoch: 10n }),
            stakeHistory: [],
        });
        const result = await getStakeActivation(rpc, STAKE_ACCOUNT_ADDRESS);
        expect(result.status).toBe('inactive');
        expect(result.active).toBe(0n);
        // lamports (3_282_880) - active (0) - rentReserve (2_282_880) = 1_000_000
        expect(result.inactive).toBe(1_000_000n);
    });
});

type DelegatedStakeFixtureInput = {
    kind?: 'delegated';
    lamports?: bigint;
    rentExemptReserve?: bigint;
    stake?: bigint;
    activationEpoch?: bigint;
    deactivationEpoch?: bigint;
};
type StakeAccountFixture = DelegatedStakeFixtureInput | { kind: 'initialized' } | null;

type HistoryEntry = {
    epoch: bigint;
    activating: bigint;
    deactivating: bigint;
    effective: bigint;
};

function delegatedStakeFixture(overrides: DelegatedStakeFixtureInput = {}): DelegatedStakeFixtureInput {
    return {
        activationEpoch: 0n,
        deactivationEpoch: NEVER_DEACTIVATED,
        kind: 'delegated',
        lamports: 3_282_880n,
        rentExemptReserve: 2_282_880n,
        stake: 1_000_000n,
        ...overrides,
    };
}

function buildRpc({
    epoch,
    stakeAccount,
    stakeHistory,
}: {
    epoch: bigint;
    stakeAccount: StakeAccountFixture;
    stakeHistory: HistoryEntry[] | null;
}): StakeActivationRpc {
    return {
        getAccountInfo: (addr: Address) => ({
            send: async () =>
                addr === STAKE_HISTORY_ADDRESS
                    ? buildStakeHistoryResponse(stakeHistory)
                    : buildStakeAccountResponse(stakeAccount),
        }),
        getEpochInfo: () => ({
            send: async () => ({ epoch }),
        }),
    };
}

function buildStakeAccountResponse(fixture: StakeAccountFixture) {
    if (fixture === null) {
        return { context: { slot: 0n }, value: null };
    }
    if (fixture.kind === 'initialized') {
        return buildJsonAccountResponse(2_282_880n, {
            parsed: {
                info: {
                    meta: defaultMeta('2282880'),
                    stake: null,
                },
                type: 'initialized',
            },
            program: 'stake',
            space: 200n,
        });
    }
    const f = { ...delegatedStakeFixture(), ...fixture };
    return buildJsonAccountResponse(f.lamports ?? 0n, {
        parsed: {
            info: {
                meta: defaultMeta(String(f.rentExemptReserve)),
                stake: {
                    creditsObserved: 0,
                    delegation: {
                        activationEpoch: String(f.activationEpoch),
                        deactivationEpoch: String(f.deactivationEpoch),
                        stake: String(f.stake),
                        voter: '11111111111111111111111111111111',
                        warmupCooldownRate: 0.09,
                    },
                },
            },
            type: 'delegated',
        },
        program: 'stake',
        space: 200n,
    });
}

function buildStakeHistoryResponse(entries: HistoryEntry[] | null) {
    if (entries === null) {
        return { context: { slot: 0n }, value: null };
    }
    return buildJsonAccountResponse(1n, {
        parsed: {
            info: entries.map(e => ({
                epoch: e.epoch,
                stakeHistory: { activating: e.activating, deactivating: e.deactivating, effective: e.effective },
            })),
            type: 'stakeHistory',
        },
        program: 'sysvar',
        space: BigInt(entries.length * 32),
    });
}

function buildJsonAccountResponse(lamports: bigint, data: unknown) {
    return {
        context: { slot: 0n },
        value: {
            data,
            executable: false,
            lamports,
            owner: '11111111111111111111111111111111',
            space: 200n,
        },
    };
}

function defaultMeta(rentExemptReserve: string) {
    return {
        authorized: {
            staker: '11111111111111111111111111111111',
            withdrawer: '11111111111111111111111111111111',
        },
        lockup: {
            custodian: '11111111111111111111111111111111',
            epoch: 0,
            unixTimestamp: 0,
        },
        rentExemptReserve,
    };
}
