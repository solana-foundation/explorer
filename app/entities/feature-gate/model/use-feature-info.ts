import { useMemo } from 'react';

import { getFeatureInfo } from '../lib/get-feature-info';

export function useFeatureInfo({ address }: { address: string }) {
    return useMemo(() => getFeatureInfo(address), [address]);
}
