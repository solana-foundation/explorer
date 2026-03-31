import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { getProxiedUri } from '@/app/features/metadata/utils';

import type { NftJson } from './types';

export type GetMetadataJsonDeps = {
    onError?: (error: unknown) => void;
};

// eslint-disable-next-line no-restricted-syntax -- match image data URI mime types
const IMAGE_MIME_TYPE_REGEX = /data:image\/(svg\+xml|png|jpeg|gif)/;

export async function getMetadataJson(
    metadata: Metadata,
    deps?: GetMetadataJsonDeps,
): Promise<NftJson | undefined> {
    return new Promise(resolve => {
        const uri = metadata.uri;
        if (!uri) return resolve(undefined);

        const processJson = (extended: any) => {
            if (!extended || (!extended.image && extended?.properties?.files?.length === 0)) {
                return;
            }

            if (extended?.image) {
                extended.image =
                    extended.image.startsWith('http') || IMAGE_MIME_TYPE_REGEX.test(extended.image)
                        ? extended.image
                        : `${metadata.uri}/${extended.image}`;
            }

            return extended;
        };

        try {
            fetch(getProxiedUri(uri))
                .then(async _ => {
                    try {
                        const data = await _.json();
                        try {
                            localStorage.setItem(uri, JSON.stringify(data));
                        } catch {
                            // ignore
                        }
                        resolve(processJson(data));
                    } catch {
                        resolve(undefined);
                    }
                })
                .catch(() => {
                    resolve(undefined);
                });
        } catch (ex) {
            deps?.onError?.(ex);
            resolve(undefined);
        }
    });
}
