import { type Address, address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { getStakeActivation } from '../stake-activation';

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

    it('should assemble the response end-to-end through parse, math, and status derivation', async () => {
        // One epoch after activation, the cluster's 9% warmup cap applies.
        // newlyEffective = (remaining / activating) * (effective * 0.09)
        //                = (100M / 100M) * (1B * 0.09)
        //                = 90M
        // The math itself is unit-tested in lib/__tests__/stake-activation-math.spec.ts; this
        // test exists to verify the full pipeline — kit JSON shape parsing, lamports/rent
        // arithmetic, and status derivation — all wire together.
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
}) {
    const rpc = {
        getAccountInfo: (addr: Address) => ({
            send: async () =>
                addr === STAKE_HISTORY_ADDRESS
                    ? buildStakeHistoryResponse(stakeHistory)
                    : buildStakeAccountResponse(stakeAccount),
        }),
        getEpochInfo: () => ({
            send: async () => ({
                absoluteSlot: 0n,
                blockHeight: 0n,
                epoch,
                slotIndex: 0n,
                slotsInEpoch: 432_000n,
                transactionCount: null,
            }),
        }),
    };
    // The mock matches the structural surface getStakeActivation uses (.getEpochInfo,
    // .getAccountInfo with `.send()`), but not the full Rpc<...> generic. Casting at the
    // test/mock boundary keeps the production type strict.
    return rpc as unknown as Parameters<typeof getStakeActivation>[0];
}

function buildStakeAccountResponse(fixture: StakeAccountFixture) {
    if (fixture === null) {
        return { context: { slot: 0n }, value: null };
    }
    if (fixture.kind === 'initialized') {
        return buildJsonAccountResponse(2_282_880n, {
            program: 'stake',
            space: 200n,
            parsed: {
                info: {
                    meta: defaultMeta('2282880'),
                    stake: null,
                },
                type: 'initialized',
            },
        });
    }
    const f = { ...delegatedStakeFixture(), ...fixture };
    return buildJsonAccountResponse(f.lamports ?? 0n, {
        program: 'stake',
        space: 200n,
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
    });
}

function buildStakeHistoryResponse(entries: HistoryEntry[] | null) {
    if (entries === null) {
        return { context: { slot: 0n }, value: null };
    }
    return buildJsonAccountResponse(1n, {
        program: 'sysvar',
        space: BigInt(entries.length * 32),
        parsed: {
            info: entries.map(e => ({
                epoch: e.epoch,
                stakeHistory: { activating: e.activating, deactivating: e.deactivating, effective: e.effective },
            })),
            type: 'stakeHistory',
        },
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
