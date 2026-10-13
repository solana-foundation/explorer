import { type NftokenMetadata, type NftokenNftInfo } from '@explorer/decoder-nftoken';
import { useCluster } from '@providers/cluster';
import useSWR, { SWRResponse } from 'swr';

import { invariant } from '@/app/shared/lib/invariant';

import { NftokenFetcher } from './nftoken';

const getCollectionNftsFetcher = async ([_method, collectionAddress, url]: [string, string, string]) => {
    return await NftokenFetcher.getNftsInCollection({
        collection: collectionAddress,
        rpcUrl: url,
    });
};

export const useCollectionNfts = ({
    collectionAddress,
}: {
    collectionAddress: string;
}): {
    // We can be confident that data will be nonnull even if the request fails,
    // if we defined fallbackData in the config.
    data: NftokenNftInfo[];
    error: any;
    mutate: SWRResponse<NftokenNftInfo[], never>['mutate'];
} => {
    const { url } = useCluster();

    const swrKey = ['getNftsInCollection', collectionAddress, url];
    const { data, error, mutate } = useSWR(swrKey, getCollectionNftsFetcher, {
        suspense: true,
    });
    invariant(data, 'SWR suspense guarantees data is non-null');
    return { data, error, mutate };
};

const getMetadataFetcher = async (metadataUrl: string) => {
    return await NftokenFetcher.getMetadata({ url: metadataUrl });
};

export const useNftokenMetadata = (
    metadataUrl: string | null | undefined,
): {
    data: NftokenMetadata | null;
    error: any;
    mutate: SWRResponse<NftokenMetadata | null, never>['mutate'];
} => {
    const swrKey = [metadataUrl];
    const { data, error, mutate } = useSWR(swrKey, getMetadataFetcher, {
        suspense: true,
    });
    invariant(data !== undefined, 'SWR suspense guarantees data is defined');
    return { data, error, mutate };
};
