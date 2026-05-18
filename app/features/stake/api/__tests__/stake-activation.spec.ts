import { type AccountInfoWithJsonData } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { type Delegation } from '../../lib/stake-activation-math';
import { getStakeActivation, type StakeActivationInput, type StakeActivationRpc } from '../stake-activation';

// Sentinel deactivation epoch used on chain for stake that has never been deactivated.
const NEVER_DEACTIVATED = 18446744073709551615n;

describe('getStakeActivation', () => {
    it('should throw when the stake history sysvar is not found', async () => {
        const rpc = buildRpc({ epoch: 100n, stakeHistory: null });
        await expect(getStakeActivation(rpc, defaultInput())).rejects.toThrow('StakeHistory not found');
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
            stakeHistory: [{ activating: 100_000_000n, deactivating: 0n, effective: 1_000_000_000n, epoch: 10n }],
        });
        const result = await getStakeActivation(
            rpc,
            defaultInput({
                delegation: { activationEpoch: 10n, deactivationEpoch: NEVER_DEACTIVATED, stake: 100_000_000n },
                lamports: 100_002_282_880n,
            }),
        );
        expect(result.status).toBe('activating');
        expect(result.active).toBe(90_000_000n);
        // lamports (100_002_282_880) - active (90_000_000) - rentReserve (2_282_880)
        expect(result.inactive).toBe(99_910_000_000n);
    });

    it('should derive "active" status for a fully warmed delegation', async () => {
        // Empty history at a target epoch past activation → "dropped out of history" branch
        // returns the full delegated stake as effective.
        const rpc = buildRpc({ epoch: 100n, stakeHistory: [] });
        const result = await getStakeActivation(rpc, defaultInput());
        expect(result.status).toBe('active');
        expect(result.active).toBe(1_000_000n);
        expect(result.inactive).toBe(0n);
    });

    it('should derive "deactivating" status at the deactivation epoch', async () => {
        // At target == deactivationEpoch, all effective stake is reported as deactivating.
        const rpc = buildRpc({ epoch: 50n, stakeHistory: [] });
        const result = await getStakeActivation(
            rpc,
            defaultInput({ delegation: { activationEpoch: 0n, deactivationEpoch: 50n, stake: 1_000_000n } }),
        );
        expect(result.status).toBe('deactivating');
        expect(result.active).toBe(1_000_000n);
        expect(result.inactive).toBe(0n);
    });

    it('should derive "inactive" status for a fully decayed delegation', async () => {
        // Target far past deactivation with no history entry → math returns all zeros.
        const rpc = buildRpc({ epoch: 100n, stakeHistory: [] });
        const result = await getStakeActivation(
            rpc,
            defaultInput({ delegation: { activationEpoch: 0n, deactivationEpoch: 10n, stake: 1_000_000n } }),
        );
        expect(result.status).toBe('inactive');
        expect(result.active).toBe(0n);
        // lamports (3_282_880) - active (0) - rentReserve (2_282_880) = 1_000_000
        expect(result.inactive).toBe(1_000_000n);
    });
});

type HistoryEntry = {
    epoch: bigint;
    activating: bigint;
    deactivating: bigint;
    effective: bigint;
};

function defaultInput(overrides: Partial<StakeActivationInput> = {}): StakeActivationInput {
    const defaultDelegation: Delegation = {
        activationEpoch: 0n,
        deactivationEpoch: NEVER_DEACTIVATED,
        stake: 1_000_000n,
    };
    return {
        delegation: defaultDelegation,
        lamports: 3_282_880n,
        rentExemptReserve: 2_282_880n,
        ...overrides,
    };
}

function buildRpc({ epoch, stakeHistory }: { epoch: bigint; stakeHistory: HistoryEntry[] | null }): StakeActivationRpc {
    return {
        getAccountInfo: () => ({
            send: async () => buildStakeHistoryResponse(stakeHistory),
        }),
        getEpochInfo: () => ({
            send: async () => ({ epoch }),
        }),
    };
}

function buildStakeHistoryResponse(entries: HistoryEntry[] | null) {
    if (entries === null) {
        return { context: { slot: 0n }, value: null };
    }
    return buildJsonAccountResponse({
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

function buildJsonAccountResponse(data: AccountInfoWithJsonData['data']) {
    return {
        context: { slot: 0n },
        value: { data },
    };
}
