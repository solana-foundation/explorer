import 'client-only';

import { type ConnectableUrl, useCluster } from '@entities/cluster';
import type { Address } from '@solana/kit';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { type CollectionNftsAnswer, fetchCollectionNfts } from '../api/fetch-collection-nfts';
import { ERROR_RETRY_COUNT } from './swr-options';

type CollectionNftsState = { kind: 'loading' } | (CollectionNftsAnswer & { refreshing: boolean }) | { kind: 'failed' };

export function useCollectionNfts(collection: Address): CollectionNftsState & { refresh: () => void } {
    const { connectableUrl } = useCluster();

    const { data, error, isValidating, mutate } = useSWRImmutable(
        connectableUrl && (['nftoken-collection-nfts', connectableUrl, collection] as const),
        ([, url, collection]: readonly ['nftoken-collection-nfts', ConnectableUrl, Address]) =>
            fetchCollectionNfts(url, collection),
        { errorRetryCount: ERROR_RETRY_COUNT, onError: error => Logger.error(error, { collection }) },
    );
    const refresh = () => void mutate();

    if (data) return { ...data, refresh, refreshing: isValidating };
    if (error) return { kind: 'failed', refresh };
    return { kind: 'loading', refresh };
}
