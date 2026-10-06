import { SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, SolanaError } from '@solana/kit';
import { vi } from 'vitest';

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

// The probe waits before every attempt and backs off after a 429.
async function runProbe(rpc: SolanaRpc) {
    const result = probeFeatureActivation(rpc, SCHEDULE, KEY);
    await vi.runAllTimersAsync();
    return result;
}

function makeRpc(value: { data: [string, string] } | null): SolanaRpc {
    // Only the .getAccountInfo(...).send() shape is exercised by probeFeatureActivation.
    return {
        getAccountInfo: () => ({
            send: async () => ({ value }),
        }),
    } as unknown as SolanaRpc;
}

function failingRpc(error: Error) {
    let calls = 0;
    const rpc = {
        getAccountInfo: () => ({
            send: async () => {
                calls += 1;
                throw error;
            },
        }),
    } as unknown as SolanaRpc;
    return { calls: () => calls, rpc };
}

function httpError(statusCode: number, message: string) {
    return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, { headers: new Headers(), message, statusCode });
}

function encode(bytes: number[]): { data: [string, string] } {
    return { data: [Buffer.from(bytes).toString('base64'), 'base64'] };
}

describe('probeFeatureActivation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should return "missing" when the RPC responds with value=null', async () => {
        const probe = await runProbe(makeRpc(null));
        expect(probe).toEqual({ kind: 'missing' });
    });

    it('should return "unactivated" when the activated flag is 0', async () => {
        const probe = await runProbe(makeRpc(encode([0, 0, 0, 0, 0, 0, 0, 0, 0])));
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should return "unactivated" when the body is empty', async () => {
        const probe = await runProbe(makeRpc(encode([])));
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should return "unactivated" when the activated flag is set but the body is truncated', async () => {
        // < 9 bytes can't carry the activation_slot u64.
        const probe = await runProbe(makeRpc(encode([1, 0, 0])));
        expect(probe).toEqual({ kind: 'unactivated' });
    });

    it('should decode the activation slot into an epoch when the flag is set', async () => {
        // Slot = firstNormalSlot + 4 * slotsPerEpoch → epoch firstNormalEpoch + 4 = 18.
        const slot = 524_256n + 4n * 432_000n;
        const bytes = [1];
        const slotBytes = Buffer.alloc(8);
        slotBytes.writeBigUInt64LE(slot);
        bytes.push(...slotBytes);
        const probe = await runProbe(makeRpc(encode(bytes)));
        expect(probe).toEqual({ epoch: 18, kind: 'activated' });
    });

    it('should return "unreachable" when the RPC throws a non-rate-limit error', async () => {
        const { calls, rpc } = failingRpc(new Error('network down'));
        expect(await runProbe(rpc)).toEqual({ kind: 'unreachable' });
        expect(calls()).toBe(1);
    });

    it('should retry on a SolanaError TRANSPORT_HTTP_ERROR with statusCode 429 before giving up', async () => {
        const { calls, rpc } = failingRpc(httpError(429, 'Too Many Requests'));
        expect(await runProbe(rpc)).toEqual({ kind: 'unreachable' });
        expect(calls()).toBe(3);
    });

    it('should NOT retry a SolanaError TRANSPORT_HTTP_ERROR whose statusCode is not 429', async () => {
        const { calls, rpc } = failingRpc(httpError(502, 'Bad Gateway'));
        await runProbe(rpc);
        expect(calls()).toBe(1);
    });
});
