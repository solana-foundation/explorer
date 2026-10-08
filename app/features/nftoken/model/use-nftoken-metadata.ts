import 'client-only';

import { useSWRConfig } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { fetchNftokenMetadata } from '../api/fetch-nftoken-metadata';
import { type NftokenMetadataAnswer } from '../lib/nftoken-metadata';
import { ERROR_RETRY_COUNT } from './swr-options';

export type NftokenMetadataState = { kind: 'loading' } | NftokenMetadataAnswer | { kind: 'failed' };

const METADATA_KEY = 'nftoken-metadata';

export function useNftokenMetadata(uri: string | undefined): NftokenMetadataState {
    const { data, error } = useSWRImmutable(
        uri === undefined ? undefined : ([METADATA_KEY, uri] as const),
        ([, uri]: readonly [typeof METADATA_KEY, string]) => fetchNftokenMetadata(uri),
        { errorRetryCount: ERROR_RETRY_COUNT, onError: error => Logger.error(error, { uri }) },
    );

    if (data) return data;
    if (error) return { kind: 'failed' };
    return { kind: 'loading' };
}

export function useRefreshNftokenMetadata(): () => void {
    const { mutate } = useSWRConfig();
    return () => void mutate(key => Array.isArray(key) && key[0] === METADATA_KEY);
}
