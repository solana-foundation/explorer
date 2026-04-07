'use client';

import { fetchMetadata, findMetadataPda, type Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { useCluster } from '@providers/cluster';
import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { getUmi } from '../lib/umi';

export const useTokenMetadata = (useMetadata: boolean | undefined, pubkey: string) => {
    const [data, setData] = useState<Metadata>();
    const { url } = useCluster();

    useAsyncEffect(
        async isMounted => {
            if (!useMetadata) return;
            if (pubkey && !data) {
                try {
                    const umi = getUmi(url);
                    const mintKey = publicKey(pubkey);
                    const pda = findMetadataPda(umi, { mint: mintKey });
                    const metadata = await fetchMetadata(umi, pda);
                    if (isMounted()) {
                        setData(metadata);
                    }
                } catch {
                    if (isMounted()) {
                        setData(undefined);
                    }
                }
            }
        },
        [useMetadata, pubkey, url, data, setData],
    );
    return { data };
};
