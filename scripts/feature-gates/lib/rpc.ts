import { address, createSolanaRpc, isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR } from '@solana/kit';

import { type EpochSchedule, getEpochForSlot } from '../../../app/utils/epoch-schedule';
import { delay, describeError } from './http';

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

const RATE_LIMIT_DELAY_MS = 500;
const MAX_RETRIES = 3;

/**
 * Discriminated result of a single on-chain probe. Lets the caller distinguish
 * "the feature account doesn't exist on chain" from "the RPC call failed"
 * — both surface as `null` from `getAccountInfo`-style helpers otherwise, but
 * they mean very different things for a refresh: a missing account is a strong
 * signal we should clear stored data, while an unreachable RPC is a transient
 * blip we should ignore.
 */
export type FeatureProbeResult =
    /** Account exists and its `activated` flag is set; `epoch` is the decoded activation epoch. */
    | { kind: 'activated'; epoch: number }
    /** Account exists but the `activated` flag is clear (or the body is too short to decode). */
    | { kind: 'unactivated' }
    /** RPC responded successfully and confirmed the account does not exist on chain. */
    | { kind: 'missing' }
    /** RPC could not be reached or retried out (rate limits, timeouts, network). */
    | { kind: 'unreachable' };

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
 * Probe the on-chain feature-gate account at `key` and classify the result.
 * Feature accounts encode `[activated_flag: u8, activation_slot: u64 little-endian, ...]`.
 *
 * Retries on rate-limit (HTTP 429) with exponential backoff; all other errors
 * surface as `{ kind: 'unreachable' }`.
 */
export async function probeFeatureActivation(
    rpc: SolanaRpc,
    schedule: EpochSchedule,
    key: string,
): Promise<FeatureProbeResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            await delay(RATE_LIMIT_DELAY_MS);
            const response = await rpc.getAccountInfo(address(key), { encoding: 'base64' }).send();
            const info = response.value;
            if (info === null) return { kind: 'missing' };

            const [base64Data] = info.data;
            const bytes = Buffer.from(base64Data, 'base64');
            if (bytes.length === 0) return { kind: 'unactivated' };

            const isActivated = bytes[0] === 1;
            if (!isActivated) return { kind: 'unactivated' };
            if (bytes.length < 9) return { kind: 'unactivated' };

            const activationSlot = bytes.readBigUInt64LE(1);
            return { epoch: Number(getEpochForSlot(schedule, activationSlot)), kind: 'activated' };
        } catch (error) {
            if (isRateLimit(error) && attempt < MAX_RETRIES - 1) {
                const waitMs = 2 ** (attempt + 1) * 1000;
                console.warn(`Rate limited on ${key}, retrying in ${waitMs}ms...`);
                await delay(waitMs);
                continue;
            }
            console.warn(`Failed to fetch ${key}: ${describeError(error)}`);
            return { kind: 'unreachable' };
        }
    }
    return { kind: 'unreachable' };
}

// `@solana/kit`'s HTTP transport raises every non-2xx response as a SolanaError
// with code SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR and the raw `statusCode` on
// the context. Use the kit-typed predicate over a string match on the message —
// public RPC providers vary in how they word the body, but the status code is
// always 429 for rate-limit responses.
function isRateLimit(error: unknown): boolean {
    return isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) && error.context.statusCode === 429;
}
