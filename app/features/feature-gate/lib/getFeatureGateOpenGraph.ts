import type { Metadata } from 'next/types';

import { getFeatureInfo } from '@/app/utils/feature-gate/utils';

import { isFeatureGateOgEnabled } from '../env';
import { IMAGE_SIZE } from '../ui/BaseFeatureGateImage';

export function getFeatureGateOpenGraph(address: string, title: string): Metadata['openGraph'] | undefined {
    if (!isFeatureGateOgEnabled()) return undefined;
    if (!getFeatureInfo(address)) return undefined;

    return {
        images: [{ ...IMAGE_SIZE, url: `/og/feature-gate/${address}` }],
        title,
    };
}
