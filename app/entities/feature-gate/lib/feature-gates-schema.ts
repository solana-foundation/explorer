import { AddressFromString } from '@validators/pubkey';
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
 *
 * `key` validates as a base58 address (the shared `AddressFromString` from
 * `app/validators/pubkey.ts`), so a malformed row from the wiki fails the
 * schema test in CI — and `create()` in `feature-store.ts` at cron time —
 * rather than reaching a reader as an invalid address. The `Address` brand it
 * produces flows to every reader (the UI passes `feature.key` straight to
 * `AddressLink` without re-validating); producers that build rows from
 * untrusted strings use {@link FeatureGateDraft} (plain-string `key`) and get
 * branded at the `create()` write boundary.
 */
export const FeatureGateSchema = object({
    comms_required: nullable(string()),
    description: nullable(string()),
    devnet_activation_epoch: nullable(number()),
    key: AddressFromString,
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

/**
 * Producer-side shape: identical to {@link FeatureGate} but with an unvalidated
 * plain-string `key`. The update pipeline (`scripts/feature-gates/`) builds rows
 * from untrusted wiki text where the key isn't yet known to be a valid address;
 * `create(FeatureGatesArraySchema)` in `feature-store.ts` validates and brands
 * `key` to kit's `Address` as the rows are written.
 */
export type FeatureGateDraft = Omit<FeatureGate, 'key'> & { key: string };
