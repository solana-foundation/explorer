import { useMemo } from 'react';

import FEATURES from './featureGates.json';
import { FeatureInfoType } from './types';

export function getFeatureInfo(address: string): FeatureInfoType | undefined {
    const index = FEATURES.findIndex((feature) => feature.key === address);

    if (index === -1) return undefined;

    return FEATURES[index] as FeatureInfoType;
}

export function useFeatureInfo({ address }: { address: string }) {
    return useMemo(() => getFeatureInfo(address), [address]);
}
