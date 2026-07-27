import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { StakeAccountInfo } from '../validators';

// jsonParsed delegation as returned by a current mainnet RPC (e.g. explorer-api.mainnet-beta),
// which omits the deprecated `warmupCooldownRate`. Older/other RPCs (e.g. Helius) still include it.
const delegationWithoutWarmup = {
    activationEpoch: '943',
    deactivationEpoch: '18446744073709551615',
    stake: '211538284',
    voter: 'BULKEEKf9Hjy4nwCthjzheEk4joH23LLXttAHjqEZmB2',
};

function delegatedInfo(delegation: Record<string, unknown>) {
    return {
        meta: {
            authorized: {
                staker: 'G4VmLamEV6h15gndx7nHn8TTcu7fJkBBNVN3wTugMNtH',
                withdrawer: 'G4VmLamEV6h15gndx7nHn8TTcu7fJkBBNVN3wTugMNtH',
            },
            lockup: { custodian: 'G4VmLamEV6h15gndx7nHn8TTcu7fJkBBNVN3wTugMNtH', epoch: 0, unixTimestamp: 0 },
            rentExemptReserve: '2282880',
        },
        stake: { creditsObserved: 917932142, delegation },
    };
}

describe('StakeAccountInfo', () => {
    it('should validate a delegation that omits the deprecated warmupCooldownRate', () => {
        expect(() => create(delegatedInfo(delegationWithoutWarmup), StakeAccountInfo)).not.toThrow();
    });

    it('should still validate a delegation that includes warmupCooldownRate', () => {
        expect(() =>
            create(delegatedInfo({ ...delegationWithoutWarmup, warmupCooldownRate: 0.09 }), StakeAccountInfo),
        ).not.toThrow();
    });
});
