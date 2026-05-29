import type { EpochSchedule } from '../../../../app/utils/epoch-schedule';
import { probeFeatureActivation, type SolanaRpc } from '../rpc';

// A schedule where slotsPerEpoch=432_000 and warmup happens before slot 524_256
// (epoch 14). Anything past that maps linearly: epoch = 14 + (slot - 524_256) / 432_000.
const SCHEDULE: EpochSchedule = {
    firstNormalEpoch: 14n,
    firstNormalSlot: 524_256n,
    slotsPerEpoch: 432_000n,
};

const KEY = '7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4';

function makeRpc(value: { data: [string, string] } | null): SolanaRpc {
    // Only the .getAccountInfo(...).send() shape is exercised by probeFeatureActivation.
    return {
        getAccountInfo: () => ({
            send: async () => ({ value }),
        }),
    } as unknown as SolanaRpc;
}

function failingRpc(error: Error): SolanaRpc {
    return {
        getAccountInfo: () => ({
            send: async () => {
                throw error;
            },
        }),
    } as unknown as SolanaRpc;
}

function encode(bytes: number[]): { data: [string, string] } {
    return { data: [Buffer.from(bytes).toString('base64'), 'base64'] };
}

describe('probeFeatureActivation', () => {
    it('should return "missing" when the RPC responds with value=null', async () => {
        const probe = await probeFeatureActivation(makeRpc(null), SCHEDULE, KEY);
        expect(probe).toEqual({ kind: 'missing' });
    });

    it('should return "unactivated" when the activated flag is 0', async () => {
        const probe = await probeFeatureActivation(makeRpc(encode([0, 0, 0, 0, 0, 0, 0, 0, 0])), SCHEDULE, KEY);
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should return "unactivated" when the body is empty', async () => {
        const probe = await probeFeatureActivation(makeRpc(encode([])), SCHEDULE, KEY);
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should return "unactivated" when the activated flag is set but the body is truncated', async () => {
        // < 9 bytes can't carry the activation_slot u64.
        const probe = await probeFeatureActivation(makeRpc(encode([1, 0, 0])), SCHEDULE, KEY);
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should decode the activation slot into an epoch when the flag is set', async () => {
        // Slot = firstNormalSlot + 4 * slotsPerEpoch → epoch firstNormalEpoch + 4 = 18.
        const slot = 524_256n + 4n * 432_000n;
        const bytes = [1];
        const slotBytes = Buffer.alloc(8);
        slotBytes.writeBigUInt64LE(slot);
        bytes.push(...slotBytes);
        const probe = await probeFeatureActivation(makeRpc(encode(bytes)), SCHEDULE, KEY);
        expect(probe).toEqual({ epoch: 18, kind: 'activated' });
    });

    it('should return "unreachable" when the RPC throws a non-rate-limit error', async () => {
        // The retry loop only retries 429s; other errors fall through immediately.
        const probe = await probeFeatureActivation(failingRpc(new Error('network down')), SCHEDULE, KEY);
        expect(probe).toEqual({ kind: 'unreachable' });
    });
});
