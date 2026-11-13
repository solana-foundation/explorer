import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Account, isTokenProgramData } from '@providers/accounts';
import React from 'react';

import { useCluster } from '@/app/providers/cluster';
import { useCompressedNft } from '@/app/providers/compressed-nft';
import { getProxiedUri } from '@/app/shared/lib/metadata-proxy';
import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

interface Attribute {
    trait_type: string;
    value: string;
}

const COLUMNS: ReadonlyArray<GridTableColumn<Attribute>> = [
    {
        header: 'Trait type',
        render: ({ trait_type }) => trait_type,
    },
    {
        header: 'Value',
        render: ({ value }) => value,
    },
];

export function MetaplexNFTAttributesCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account?.pubkey.toString() ?? '', url });

    const parsedData = account?.data?.parsed;
    if (!parsedData || !isTokenProgramData(parsedData) || parsedData.parsed.type !== 'mint' || !parsedData.nftData) {
        if (compressedNft && compressedNft.compression.compressed) {
            return <NormalMetaplexNFTAttributesCard metadataUri={compressedNft.content.json_uri} />;
        }
        return onNotFound();
    }
    return <NormalMetaplexNFTAttributesCard metadataUri={parsedData.nftData.metadata.uri} />;
}

export function NormalMetaplexNFTAttributesCard({ metadataUri }: { metadataUri: string }) {
    const [attributes, setAttributes] = React.useState<Attribute[]>([]);
    const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
    const [attempt, setAttempt] = React.useState(0);

    async function fetchMetadataAttributes(isCancelled: () => boolean) {
        try {
            // The browser caches a proxy error response, so a retry must skip the cache.
            const response = await fetch(getProxiedUri(metadataUri), attempt > 0 ? { cache: 'no-cache' } : undefined);
            const metadata = await response.json();
            if (isCancelled()) return;

            // Verify if the attributes value is an array
            if (Array.isArray(metadata.attributes)) {
                // Filter attributes to keep objects matching schema
                const filteredAttributes = metadata.attributes.filter((attribute: any) => {
                    return (
                        typeof attribute === 'object' &&
                        typeof attribute.trait_type === 'string' &&
                        (typeof attribute.value === 'string' || typeof attribute.value === 'number')
                    );
                });

                setAttributes(filteredAttributes);
                setStatus('success');
            } else {
                throw new Error('Attributes is not an array');
            }
        } catch (_error) {
            if (!isCancelled()) setStatus('error');
        }
    }

    function retryAttributes() {
        setStatus('loading');
        setAttempt(count => count + 1);
    }

    React.useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        fetchMetadataAttributes(() => cancelled);
        return () => {
            cancelled = true;
        };
    }, [metadataUri, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading') {
        return <LoadingCard />;
    }

    if (status === 'error') {
        return <ErrorCard retry={retryAttributes} text="Failed to fetch attributes" />;
    }

    return (
        <GridTableCard
            title="Attributes"
            ariaLabel="Attributes"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={attributes}
            getRowKey={({ trait_type, value }) => `${trait_type}:${value}`}
        />
    );
}
