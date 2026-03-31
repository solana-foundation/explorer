import fetch from 'cross-fetch';

import { Logger } from '@/app/shared/lib/logger';
import { FeatureInfoType } from '@/app/utils/feature-gate/types';

// Good candidate to move to environment variables, but at the moment repository is public, so we leave them hardcoded (could be changed later)
const OWNER = 'solana-foundation';
const REPO = 'solana-improvement-documents';
const BRANCH = 'main';
const PATH_COMPONENT = 'proposals';

export async function fetchFeatureGateInformation(featureInfo?: FeatureInfoType): Promise<string[]> {
    const empty: string[] = ['No data'];

    const fileNames = featureInfo?.simd_link ?? null;

    if (fileNames === null) return empty;

    const results = await Promise.all(
        fileNames.map(async fileName => {
            const link = getLink(fileName);
            try {
                const resp = await fetch(link, { method: 'GET' });

                if (!resp.ok) return 'No data';

                return resp.text();
            } catch (_e) {
                Logger.debug('[feature-gate] Cannot fetch link', { link });
                return 'No data';
            }
        }),
    );

    return results;
}

export function getLink(simdLink: string) {
    // All the READMEs are stored at the same directory. That's why we only need the file name.
    const components = simdLink.split('/');
    const file = components[components.length - 1];

    const uri = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH_COMPONENT}/${file}`;

    return uri;
}
