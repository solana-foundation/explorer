import { getRpc } from '@entities/cluster';
import {
    decodeNftokenNftAccount,
    NFT_ACCOUNT_COLLECTION_OFFSET,
    NFT_ACCOUNT_DISCRIMINATOR_BASE58,
    NFTOKEN_ADDRESS,
    type NftokenMetadata,
    type NftokenNftAccount,
    type NftokenNftInfo,
} from '@explorer/decoder-nftoken';
import { type Base58EncodedBytes, getBase64Encoder } from '@solana/kit';
import pLimit from 'p-limit';

import { Logger } from '@/app/shared/lib/logger';

const BASE64_ENCODER = getBase64Encoder();

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NftokenFetcher {
    export const getNftsInCollection = async ({
        collection,
        rpcUrl,
    }: {
        collection: string;
        rpcUrl: string;
    }): Promise<NftokenNftInfo[]> => {
        const accounts = await getRpc(rpcUrl)
            .getProgramAccounts(NFTOKEN_ADDRESS, {
                encoding: 'base64',
                filters: [
                    {
                        memcmp: {
                            bytes: NFT_ACCOUNT_DISCRIMINATOR_BASE58 as Base58EncodedBytes,
                            encoding: 'base58',
                            offset: 0n,
                        },
                    },
                    {
                        memcmp: {
                            bytes: collection as Base58EncodedBytes,
                            encoding: 'base58',
                            offset: NFT_ACCOUNT_COLLECTION_OFFSET,
                        },
                    },
                ],
            })
            .send();

        const parsed_accounts: NftokenNftAccount[] = accounts.flatMap(account => {
            try {
                return (
                    decodeNftokenNftAccount(
                        account.pubkey.toString(),
                        BASE64_ENCODER.encode(account.account.data[0]),
                    ) ?? []
                );
            } catch (e) {
                Logger.error(e);
                return [];
            }
        });

        const metadata_urls = parsed_accounts.map(a => a.metadata_url);
        const metadataMap = await getMetadataMap({ urls: metadata_urls });

        const nfts = parsed_accounts.map(account => ({
            ...account,
            ...metadataMap.get(account.metadata_url),
        }));
        return nfts.sort((a, b) => {
            if (a.name && b.name) {
                return a.name < b.name ? -1 : 1;
            }

            if (a.name) {
                return 1;
            }

            if (b.name) {
                return -1;
            }

            return a.address < b.address ? 1 : -1;
        });
    };

    export const getMetadata = async ({ url }: { url: string | null | undefined }): Promise<NftokenMetadata | null> => {
        if (!url) {
            return null;
        }

        const metadataMap = await getMetadataMap({
            urls: [url],
        });
        return metadataMap.get(url) ?? null;
    };

    export const getMetadataMap = async ({
        urls: _urls,
    }: {
        urls: Array<string | null | undefined>;
    }): Promise<Map<string, NftokenMetadata | null>> => {
        const urls = Array.from(new Set(_urls.filter((url): url is string => Boolean(url))));

        const metadataMap = new Map<string, NftokenMetadata | null>();

        const limit = pLimit(5);
        const promises = urls.map(url =>
            limit(async () => {
                try {
                    const response = await fetch(url, {
                        signal: AbortSignal.timeout(5_000),
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch NFT metadata: ${response.status}`);
                    }
                    const data = await response.json();
                    metadataMap.set(url, {
                        animation_url: data.animation_url ?? null,
                        description: data.description ?? null,
                        external_url: data.external_url ?? null,
                        image: data.image ?? '',
                        name: data.name ?? '',
                        traits: data.traits ?? [],
                    });
                } catch {
                    metadataMap.set(url, null);
                }
            }),
        );
        await Promise.all(promises);

        return metadataMap;
    };
}
