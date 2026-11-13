import { type FeatureInfoType } from '@entities/feature-gate';

import { Logger } from '@/app/shared/lib/logger';

// Good candidate to move to environment variables, but at the moment repository is public, so we leave them hardcoded (could be changed later)
const OWNER = 'solana-foundation';
const REPO = 'solana-improvement-documents';
const BRANCH = 'main';
const PATH_COMPONENT = 'proposals';

// A proposal's text, or a marker that it could not be fetched, so the page can tell a failed fetch from
// proposal text instead of rendering the string 'No data' as markdown. `url` is the proposal's own link.
export type FeatureGateProposal = { status: 'ok'; markdown: string } | { status: 'unavailable'; url: string };

export async function fetchFeatureGateInformation(featureInfo?: FeatureInfoType): Promise<FeatureGateProposal[]> {
    const fileNames = featureInfo?.simd_link;

    if (!fileNames) return [];

    return Promise.all(
        fileNames.map(async (fileName): Promise<FeatureGateProposal> => {
            const link = getLink(fileName);
            try {
                const resp = await fetch(link, { method: 'GET' });

                if (!resp.ok) {
                    Logger.warn('[feature-gate] SIMD fetch failed', { link, status: resp.status });
                    return { status: 'unavailable', url: fileName };
                }

                return { markdown: await resp.text(), status: 'ok' };
            } catch (e) {
                Logger.warn('[feature-gate] Cannot fetch link', { cause: e, link });
                return { status: 'unavailable', url: fileName };
            }
        }),
    );
}

export function getLink(simdLink: string) {
    // All SIMD proposal files live in the same directory, so only the file name matters.
    const components = simdLink.split('/');
    const file = components[components.length - 1];

    const uri = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH_COMPONENT}/${file}`;

    return uri;
}
