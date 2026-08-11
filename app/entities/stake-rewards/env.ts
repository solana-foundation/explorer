import { isEnvEnabled } from '@utils/env';

/**
 * Read at the call site rather than at module scope. A module-scope read freezes the value at
 * import time, which breaks `vi.stubEnv` in tests and per-environment config on the server.
 */
export const getSolscanApiKey = () => process.env.SOLSCAN_API_KEY;

/**
 * Whether the Total Reward row is enabled for this deployment.
 *
 * Distinct from the API key being set, because only the client can act on it: without a flag the
 * browser has no way to learn the feature is off, so it requests the total on every stake page and
 * renders `Unavailable` — which reads as broken rather than as not-enabled-here. The row is hidden
 * outright when this is off, leaving `Unavailable` to mean what it should: the figure exists but
 * could not be fetched.
 *
 * `NEXT_PUBLIC_*` is inlined by Next at build time whether read here or at module scope, so the
 * call-site read costs the client nothing.
 */
export const isStakeTotalRewardEnabled = () => isEnvEnabled(process.env.NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED);
