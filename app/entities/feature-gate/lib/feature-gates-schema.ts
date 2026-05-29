import { array, type Infer, nullable, number, object, string } from 'superstruct';

/**
 * Runtime shape of an entry in `app/entities/feature-gate/feature-gates.json`.
 *
 * The same schema is the write contract for `scripts/update-feature-gates.ts`
 * and friends, and the read contract for the explorer UI — any drift between
 * the cron-generated JSON and what the UI expects will be caught by the
 * schema-validation test that loads the JSON through this schema.
 *
 * `object` (not `type`) on purpose: an unknown/renamed field must fail loudly
 * rather than ride along silently. `feature-store.ts` round-trips the JSON
 * through `create()`, where `object` rejects stray keys while `type` would
 * pass them straight back to disk. Every field is required either way —
 * `nullable()` covers "present but empty", not "absent".
 */
export const FeatureGateSchema = object({
    comms_required: nullable(string()),
    description: nullable(string()),
    devnet_activation_epoch: nullable(number()),
    key: string(),
    mainnet_activation_epoch: nullable(number()),
    min_agave_versions: array(string()),
    min_fd_versions: array(string()),
    min_jito_versions: array(string()),
    owners: array(string()),
    planned_testnet_order: nullable(number()),
    simd_link: array(string()),
    simds: array(string()),
    testnet_activation_epoch: nullable(number()),
    title: string(),
});

export const FeatureGatesArraySchema = array(FeatureGateSchema);

export type FeatureGate = Infer<typeof FeatureGateSchema>;
