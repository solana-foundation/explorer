import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Account, isTokenProgramData } from '@providers/accounts';
import React from 'react';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { useCluster } from '@/app/providers/cluster';
import { useCompressedNft } from '@/app/providers/compressed-nft';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

interface Attribute {
    trait_type: string;
    value: string;
}

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

    async function fetchMetadataAttributes() {
        try {
            const response = await fetch(getProxiedUri(metadataUri));
            const metadata = await response.json();

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
            setStatus('error');
        }
    }

    React.useEffect(() => {
        fetchMetadataAttributes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading') {
        return <LoadingCard />;
    }

    if (status === 'error') {
        return <ErrorCard text="Failed to fetch attributes" />;
    }

    const attributesList: React.ReactNode[] = attributes.map(({ trait_type, value }) => {
        return (
            <BaseTable.Row key={`${trait_type}:${value}`}>
                <BaseTable.Cell>{trait_type}</BaseTable.Cell>
                <BaseTable.Cell>{value}</BaseTable.Cell>
            </BaseTable.Row>
        );
    });

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Attributes
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted e-w-px">Trait type</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted e-w-px">Value</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">{attributesList}</BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
