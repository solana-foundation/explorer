import { address, createSolanaRpc } from '@solana/kit';

import { type EpochSchedule, getEpochForSlot } from '../../../app/utils/epoch-schedule';
import { delay, describeError } from './http';

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

const RATE_LIMIT_DELAY_MS = 500;
const MAX_RETRIES = 3;

/**
 * Open an RPC connection to `url` and fetch its epoch schedule up front, so the
 * per-feature activation lookups can reuse both.
 */
export async function connectCluster(url: string): Promise<{ rpc: SolanaRpc; schedule: EpochSchedule }> {
    const rpc = createSolanaRpc(url);
    const schedule = await fetchEpochSchedule(rpc);
    return { rpc, schedule };
}

async function fetchEpochSchedule(rpc: SolanaRpc): Promise<EpochSchedule> {
    const schedule = await rpc.getEpochSchedule().send();
    return {
        firstNormalEpoch: schedule.firstNormalEpoch,
        firstNormalSlot: schedule.firstNormalSlot,
        slotsPerEpoch: schedule.slotsPerEpoch,
    };
}

/**
 * Read the on-chain feature-gate account at `key` and decode its activation
 * epoch. Feature accounts encode `[activated_flag: u8, activation_slot: u64
 * little-endian, ...]`. Falls back to `backupEpoch` for unreachable accounts
 * and uninitialized features.
 *
 * Retries on rate-limit (HTTP 429) with exponential backoff; other errors are
 * logged and surface as `backupEpoch`.
 */
export async function fetchActivationEpoch(
    rpc: SolanaRpc,
    schedule: EpochSchedule,
    key: string,
    backupEpoch: number | null,
): Promise<number | null> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            await delay(RATE_LIMIT_DELAY_MS);
            const response = await rpc.getAccountInfo(address(key), { encoding: 'base64' }).send();
            const info = response.value;
            if (info === null) return backupEpoch;

            const [base64Data] = info.data;
            const bytes = Buffer.from(base64Data, 'base64');
            if (bytes.length === 0) return backupEpoch;

            const isActivated = bytes[0] === 1;
            if (!isActivated) return backupEpoch;
            if (bytes.length < 9) return backupEpoch;

            const activationSlot = bytes.readBigUInt64LE(1);
            return Number(getEpochForSlot(schedule, activationSlot));
        } catch (error) {
            if (isRateLimit(error) && attempt < MAX_RETRIES - 1) {
                const waitMs = 2 ** (attempt + 1) * 1000;
                console.warn(`Rate limited on ${key}, retrying in ${waitMs}ms...`);
                await delay(waitMs);
                continue;
            }
            console.warn(`Failed to fetch ${key}: ${describeError(error)}`);
            return backupEpoch;
        }
    }
    return backupEpoch;
}

function isRateLimit(error: unknown): boolean {
    return describeError(error).includes('429');
}
