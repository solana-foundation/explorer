import type { Metadata } from 'next/types';

import { getFeatureInfo } from '@/app/utils/feature-gate/utils';
import { EXPLORER_BASE_URL } from '@utils/env';

import { IMAGE_SIZE } from '../constants';
import { isFeatureGateOgEnabled } from '../env';

export function getFeatureGateOpenGraph(address: string): Metadata['openGraph'] | undefined {
    if (!isFeatureGateOgEnabled()) return undefined;

    const featureInfo = getFeatureInfo(address);
    if (!featureInfo) return undefined;

    return {
        images: [{ ...IMAGE_SIZE, url: `${EXPLORER_BASE_URL}/og/feature-gate/${address}` }],
        title: `Feature Gate | ${featureInfo.title} | Solana`,
    };
}
