#!/usr/bin/env tsx
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const CLUSTER_FIXTURES_DIR = join(__dirname, '../app/__tests__/fixtures/cluster-updates');

if (!existsSync(CLUSTER_FIXTURES_DIR)) {
    mkdirSync(CLUSTER_FIXTURES_DIR, { recursive: true });
}

function preprocessForSerialization(data: any, seen = new WeakSet()): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return { __type: 'bigint', __value: data.toString() };
    if (typeof data !== 'object') return data;
    if (seen.has(data)) throw Error(`Circular object`);
    seen.add(data);
    if (Array.isArray(data)) return data.map(item => preprocessForSerialization(item, seen));
    const result: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            result[key] = preprocessForSerialization(data[key], seen);
        }
    }
    return result;
}

function saveFixture(filename: string, data: any): void {
    const filepath = join(CLUSTER_FIXTURES_DIR, `${filename}.json`);
    const preprocessed = preprocessForSerialization(data);
    writeFileSync(filepath, JSON.stringify(preprocessed, null, 2), 'utf-8');
    console.log(`✅ Saved fixture: ${filename}.json`);
}

async function recordClusterFixture(testName: string, cluster: string, url: string) {
    // Use simple, human-readable fixture name: testName-cluster.json
    const fixtureKey = `cluster-updates-${cluster}`;

    console.log(`\n📡 Recording fixture for: ${testName}`);
    console.log(`   Cluster: ${cluster}`);
    console.log(`   URL: ${url}`);
    console.log(`   Fixture file: ${fixtureKey}.json`);

    try {
        // Fetch all three RPC calls in parallel
        const [epochInfoResp, epochScheduleResp, firstBlockResp] = await Promise.all([
            fetch(url, {
                body: JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'getEpochInfo',
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
            fetch(url, {
                body: JSON.stringify({
                    id: 2,
                    jsonrpc: '2.0',
                    method: 'getEpochSchedule',
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
            fetch(url, {
                body: JSON.stringify({
                    id: 3,
                    jsonrpc: '2.0',
                    method: 'getFirstAvailableBlock',
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        ]);

        const [epochInfoData, epochScheduleData, firstBlockData] = await Promise.all([
            epochInfoResp.json(),
            epochScheduleResp.json(),
            firstBlockResp.json(),
        ]);

        // Check for errors
        if (epochInfoData.error) throw new Error(`getEpochInfo error: ${JSON.stringify(epochInfoData.error)}`);
        if (epochScheduleData.error)
            throw new Error(`getEpochSchedule error: ${JSON.stringify(epochScheduleData.error)}`);
        if (firstBlockData.error)
            throw new Error(`getFirstAvailableBlock error: ${JSON.stringify(firstBlockData.error)}`);

        // Build fixture data
        const fixtureData = {
            epochInfo: {
                absoluteSlot: BigInt(epochInfoData.result.absoluteSlot),
                blockHeight: BigInt(epochInfoData.result.blockHeight),
                epoch: BigInt(epochInfoData.result.epoch),
                slotIndex: BigInt(epochInfoData.result.slotIndex),
                slotsInEpoch: BigInt(epochInfoData.result.slotsInEpoch),
            },
            epochSchedule: {
                firstNormalEpoch: BigInt(epochScheduleData.result.firstNormalEpoch),
                firstNormalSlot: BigInt(epochScheduleData.result.firstNormalSlot),
                leaderScheduleSlotOffset: BigInt(epochScheduleData.result.leaderScheduleSlotOffset),
                slotsPerEpoch: BigInt(epochScheduleData.result.slotsPerEpoch),
                warmup: epochScheduleData.result.warmup,
            },
            firstAvailableBlock: BigInt(firstBlockData.result),
        };

        saveFixture(fixtureKey, fixtureData);

        console.log(`   ✨ Success!`);
    } catch (error) {
        console.error(`   ❌ Failed:`, error);
        throw error;
    }
}

// Common test configurations
const TEST_CONFIGS = {
    'default-test': {
        cluster: 'mainnet-beta',
        url: 'https://api.mainnet-beta.solana.com',
    },
    devnet: {
        cluster: 'devnet',
        url: 'https://api.devnet.solana.com',
    },
    testnet: {
        cluster: 'testnet',
        url: 'https://api.testnet.solana.com',
    },
};

async function main() {
    const testName = process.argv[2] || 'default-test';

    console.log('🎬 Starting fixture recording...\n');

    if (testName === 'all') {
        console.log('Recording fixtures for all configurations...\n');
        for (const [name, config] of Object.entries(TEST_CONFIGS)) {
            await recordClusterFixture(name, config.cluster, config.url);
        }
    } else if (TEST_CONFIGS[testName as keyof typeof TEST_CONFIGS]) {
        const config = TEST_CONFIGS[testName as keyof typeof TEST_CONFIGS];
        await recordClusterFixture(testName, config.cluster, config.url);
    } else {
        // Assume it's a custom test name, use mainnet-beta by default
        console.log(`Custom test name: ${testName} (using mainnet-beta)`);
        await recordClusterFixture(testName, 'mainnet-beta', 'https://api.mainnet-beta.solana.com');
    }

    console.log('\n✅ All done!');
    console.log(`\nFixtures saved to: ${CLUSTER_FIXTURES_DIR}`);
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
