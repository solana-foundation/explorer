import {
    PerpMarket,
    type PerpMarketConfig,
    PerpMarketLayout,
    type SpotMarketConfig,
} from '@blockworks-foundation/mango-client';
import { Market } from '@project-serum/serum';
import {
    type AccountInfo,
    type AccountMeta,
    Connection,
    type PublicKey,
    type TransactionInstruction,
} from '@solana/web3.js';

import { findGroupConfig } from './config';

// caching of account info's by cluster url + public key
const accountInfoCache: Record<string, Promise<AccountInfo<Buffer> | null>> = {};
function getAccountInfo(clusterUrl: string, publicKey: PublicKey): Promise<AccountInfo<Buffer> | null> {
    const cacheKey = `${clusterUrl}:${publicKey.toBase58()}`;
    if (cacheKey in accountInfoCache) {
        return accountInfoCache[cacheKey];
    }
    const connection = new Connection(clusterUrl);
    const accountInfoPromise = connection.getAccountInfo(publicKey);
    accountInfoCache[cacheKey] = accountInfoPromise;
    return accountInfoPromise;
}

export function getSpotMarketFromInstruction(
    ix: TransactionInstruction,
    spotMarket: AccountMeta,
): SpotMarketConfig | undefined {
    const groupConfig = findGroupConfig(ix.programId);
    if (groupConfig === undefined) {
        return;
    }
    const spotMarketConfigs = groupConfig.spotMarkets.filter(mangoSpotMarket =>
        spotMarket.pubkey.equals(mangoSpotMarket.publicKey),
    );
    if (spotMarketConfigs.length) {
        return spotMarketConfigs[0];
    }
}

export async function getSpotMarketFromSpotMarketConfig(
    programId: PublicKey,
    clusterUrl: string,
    mangoSpotMarketConfig: SpotMarketConfig,
): Promise<Market | undefined> {
    const connection = new Connection(clusterUrl);
    const groupConfig = findGroupConfig(programId);
    if (groupConfig === undefined) {
        return;
    }
    return await Market.load(connection, mangoSpotMarketConfig.publicKey, undefined, groupConfig.serumProgramId);
}

export function getPerpMarketFromInstruction(
    ix: TransactionInstruction,
    perpMarket: AccountMeta,
): PerpMarketConfig | undefined {
    const groupConfig = findGroupConfig(ix.programId);
    if (groupConfig === undefined) {
        return;
    }
    const perpMarketConfigs = groupConfig.perpMarkets.filter(mangoPerpMarket =>
        perpMarket.pubkey.equals(mangoPerpMarket.publicKey),
    );
    if (perpMarketConfigs.length) {
        return perpMarketConfigs[0];
    }
}

export async function getPerpMarketFromPerpMarketConfig(
    clusterUrl: string,
    mangoPerpMarketConfig: PerpMarketConfig,
): Promise<PerpMarket> {
    const acc = await getAccountInfo(clusterUrl, mangoPerpMarketConfig.publicKey);
    if (acc === null) {
        throw new Error(`PerpMarket account not found: ${mangoPerpMarketConfig.publicKey.toBase58()}`);
    }
    const decoded = PerpMarketLayout.decode(acc.data);

    return new PerpMarket(
        mangoPerpMarketConfig.publicKey,
        mangoPerpMarketConfig.baseDecimals,
        mangoPerpMarketConfig.quoteDecimals,
        decoded,
    );
}

export function spotMarketFromIndex(ix: TransactionInstruction, marketIndex: number): string | undefined {
    const groupConfig = findGroupConfig(ix.programId);
    if (groupConfig === undefined) {
        return;
    }
    const spotMarketConfigs = groupConfig.spotMarkets.filter(
        spotMarketConfig => spotMarketConfig.marketIndex === marketIndex,
    );
    if (!spotMarketConfigs.length) {
        return 'UNKNOWN';
    }
    return spotMarketConfigs[0].name;
}
