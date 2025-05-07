import fetch from 'node-fetch';

import { Cluster } from '@/app/utils/cluster';
import { FeatureInfoType } from '@/app/utils/feature-gate/types';
import Logger from '@/app/utils/logger';

// Good candidate to move to environment variables, but at the moment repository is public, so we leave them hardcoded (could be changed later)
const OWNER = 'solana-foundation';
const REPO = 'solana-improvement-documents';
const BRANCH = 'main';
const PATH_COMPONENT = 'proposals';

export function getLink(simdLink: string) {
    // All the READMEs are stored at the same directory. That's why we only need the file name.
    const components = simdLink.split('/');
    const file = components[components.length - 1];

    const uri = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH_COMPONENT}/${file}`;

    return uri;
}

export async function fetchFeatureGateInformation(featureInfo?: FeatureInfoType): Promise<string[]> {
    const empty: string[] = ['No data'];

    const fileNames = featureInfo?.simd_link ?? null;

    if (fileNames === null) return empty;

    const results = await Promise.all(
        fileNames.map(async (fileName) => {
            const link = getLink(fileName);
            try {
                const resp = await fetch(link, { method: 'GET' });

                if (!resp.ok) return 'No data';

                return resp.text();
            } catch (e) {
                Logger.debug('Debug: can not fetch link', link);
                return 'No data';
            }
        })
    );

    return results;
}

export function isFeatureActivated(feature: FeatureInfoType, cluster: Cluster) {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return feature.mainnet_activation_epoch !== null;
        case Cluster.Devnet:
            return feature.devnet_activation_epoch !== null;
        case Cluster.Testnet:
            return feature.testnet_activation_epoch !== null;
        default:
            return false;
    }
}