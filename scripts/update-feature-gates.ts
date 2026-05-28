#!/usr/bin/env -S pnpm exec tsx

/**
 * Regenerate `app/entities/feature-gate/feature-gates.json`. Single entry point
 * for the daily `update-feature-gates` workflow — reads the JSON once, runs the
 * full pipeline in memory, and writes once:
 *
 *   1. Scrape the "pending mainnet/devnet/testnet" tables from the Agave
 *      Feature-Gate-Tracker wiki page, resolve the SIMD column to GitHub URLs,
 *      and merge any newly-listed features into the persisted set.
 *   2. Refresh activation epochs for every cluster (devnet, testnet, mainnet)
 *      in parallel via on-chain account reads. The three RPCs are independent
 *      hosts, so parallel passes don't contend on each other; within a pass,
 *      requests stay sequential to respect per-host rate limits.
 *   3. Back-fill any missing `description` fields from the linked SIMD markdown,
 *      with bounded concurrency to keep GitHub traffic gentle.
 *
 * Run from the repo root:
 *   pnpm exec tsx scripts/update-feature-gates.ts
 */

import type { FeatureGate } from '../app/entities/feature-gate/server';
import { readFeatureGates, writeFeatureGates } from './feature-gates/lib/feature-store';
import { connectCluster, fetchActivationEpoch } from './feature-gates/lib/rpc';
import { fetchSimdSummary } from './feature-gates/lib/simd-summary';
import { fetchWikiFeatures } from './feature-gates/lib/wiki';

const DEVNET_RPC_URL = process.env.SOLANA_DEVNET_RPC ?? 'https://api.devnet.solana.com';
const TESTNET_RPC_URL = process.env.SOLANA_TESTNET_RPC ?? 'https://api.testnet.solana.com';
const MAINNET_RPC_URL = process.env.SOLANA_MAINNET_RPC ?? 'https://api.mainnet-beta.solana.com';
const DESCRIPTION_FETCH_CONCURRENCY = 6;

async function main() {
    const wikiFeatures = await fetchWikiFeatures();
    const seeded = appendNewFeatures(readFeatureGates(), wikiFeatures);
    const withEpochs = await refreshAllEpochs(seeded);
    const enriched = await enrichDescriptions(withEpochs);
    writeFeatureGates(enriched);
}

/**
 * Append wiki features we haven't persisted before. Existing records are left
 * as-is: wiki metadata (versions, SIMDs, links) is deliberately not merged back,
 * since a failed SIMD-proposals lookup yields empty links that would otherwise
 * clobber good persisted data.
 */
function appendNewFeatures(existing: FeatureGate[], scraped: FeatureGate[]): FeatureGate[] {
    const knownKeys = new Set(existing.map(feature => feature.key));
    const newFeatures = scraped.filter(feature => feature.key && !knownKeys.has(feature.key));
    if (newFeatures.length > 0) {
        console.log('New features:');
        for (const feature of newFeatures) {
            console.log(`  ${feature.key} - ${feature.title}`);
        }
    }
    return [...existing, ...newFeatures];
}

type EpochField = 'devnet_activation_epoch' | 'mainnet_activation_epoch' | 'testnet_activation_epoch';
type EligibilityCheck = (feature: FeatureGate) => boolean;

/** Worth re-checking on devnet/testnet only while the feature hasn't shipped to mainnet. */
const stillPending: EligibilityCheck = feature => feature.mainnet_activation_epoch === null;

/** Mainnet activates only after a feature is already live on both devnet and testnet. */
const liveButNotOnMainnet: EligibilityCheck = feature =>
    feature.devnet_activation_epoch !== null &&
    feature.testnet_activation_epoch !== null &&
    feature.mainnet_activation_epoch === null;

/**
 * Refresh all three activation-epoch fields in parallel. Devnet, testnet and
 * mainnet RPCs are independent hosts, so parallel passes don't contend; within
 * a pass, requests stay sequential to respect per-host rate limits.
 */
async function refreshAllEpochs(features: FeatureGate[]): Promise<FeatureGate[]> {
    const passes = [
        { field: 'devnet_activation_epoch', isEligible: stillPending, rpcUrl: DEVNET_RPC_URL },
        { field: 'testnet_activation_epoch', isEligible: stillPending, rpcUrl: TESTNET_RPC_URL },
        { field: 'mainnet_activation_epoch', isEligible: liveButNotOnMainnet, rpcUrl: MAINNET_RPC_URL },
    ] as const;

    const epochsByField = await Promise.all(
        passes.map(pass => refreshEpochs(features, pass.field, pass.rpcUrl, pass.isEligible)),
    );

    const [devnet, testnet, mainnet] = epochsByField;
    return features.map((feature, index) => ({
        ...feature,
        devnet_activation_epoch: devnet[index],
        mainnet_activation_epoch: mainnet[index],
        testnet_activation_epoch: testnet[index],
    }));
}

/**
 * For one cluster, return an array of the same length as `features` where
 * eligible rows carry the freshly-derived epoch and skipped rows carry the
 * existing value (so the merge in `refreshAllEpochs` is a straight overwrite).
 */
async function refreshEpochs(
    features: FeatureGate[],
    field: EpochField,
    rpcUrl: string,
    isEligible: EligibilityCheck,
): Promise<(number | null)[]> {
    const clusterName = field.replace('_activation_epoch', '');
    const targets = features.map((feature, index) => ({ feature, index })).filter(({ feature }) => isEligible(feature));

    if (targets.length === 0) {
        return features.map(feature => feature[field]);
    }

    console.log(`Checking ${targets.length} features against ${clusterName}...`);
    const { rpc, schedule } = await connectCluster(rpcUrl);
    const result = features.map(feature => feature[field]);
    for (const { feature, index } of targets) {
        result[index] = await fetchActivationEpoch(rpc, schedule, feature.key, feature[field]);
        console.log(`  [${clusterName}] Checked ${feature.key}`);
    }
    return result;
}

/**
 * Back-fill missing descriptions from each feature's linked SIMD markdown.
 * Eligible features are fetched in bounded-concurrency chunks so a wave of new
 * pending features doesn't serialize into N × HTTP-RTT.
 */
async function enrichDescriptions(features: FeatureGate[]): Promise<FeatureGate[]> {
    const targets = features.filter(feature => !hasDescription(feature));
    if (targets.length === 0) {
        console.log('No descriptions to enrich.');
        return features;
    }
    console.log(`Enriching ${targets.length} feature descriptions from SIMD markdown...`);

    const summaries = new Map<string, string>();
    for (let cursor = 0; cursor < targets.length; cursor += DESCRIPTION_FETCH_CONCURRENCY) {
        const chunk = targets.slice(cursor, cursor + DESCRIPTION_FETCH_CONCURRENCY);
        const results = await Promise.all(chunk.map(feature => fetchSimdSummary(feature.simd_link)));
        for (const [chunkIndex, summary] of results.entries()) {
            const feature = chunk[chunkIndex];
            if (summary !== undefined) {
                summaries.set(feature.key, summary);
                console.log(`  + ${feature.title || feature.key}: ${summary.slice(0, 80)}…`);
            }
        }
    }
    console.log(`Enriched ${summaries.size} feature descriptions.`);

    return features.map(feature => {
        const description = summaries.get(feature.key);
        return description === undefined ? feature : { ...feature, description };
    });
}

function hasDescription(feature: FeatureGate): boolean {
    return Boolean(feature.description && feature.description.trim());
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
