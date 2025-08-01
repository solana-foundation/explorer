import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Account, isTokenProgramData } from '@providers/accounts';
import React from 'react';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { useCluster } from '@/app/providers/cluster';
import { useCompressedNft } from '@/app/providers/compressed-nft';

interface File {
    uri: string;
    type: string;
    cdn?: boolean;
}

export function MetaplexFilesCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account?.pubkey.toString() ?? '', url });

    const parsedData = account?.data?.parsed;
    if (!parsedData || !isTokenProgramData(parsedData) || parsedData.parsed.type !== 'mint' || !parsedData.nftData) {
        if (compressedNft && compressedNft.compression.compressed) {
            return <NormalMetaplexFilesCard metadataUri={compressedNft.content.json_uri} />;
        }
        return onNotFound();
    }
    return <NormalMetaplexFilesCard metadataUri={parsedData.nftData.metadata.data.uri} />;
}

function NormalMetaplexFilesCard({ metadataUri }: { metadataUri: string }) {
    const [files, setFiles] = React.useState<File[]>([]);
    const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

    async function fetchMetadataFiles() {
        try {
            const response = await fetch(getProxiedUri(metadataUri));
            const metadata = await response.json();
            // Verify if the attributes value is an array
            if (Array.isArray(metadata.properties.files)) {
                // Filter files to keep objects matching schema
                const filteredFiles = metadata.properties.files.filter((file: any) => {
                    return typeof file === 'object' && typeof file.uri === 'string' && typeof file.type === 'string';
                });

                setFiles(filteredFiles);
                setStatus('success');
            } else {
                throw new Error('Files is not an array');
            }
        } catch (error) {
            setStatus('error');
        }
    }

    React.useEffect(() => {
        fetchMetadataFiles();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading') {
        return <LoadingCard />;
    }

    if (status === 'error') {
        return <ErrorCard text="Failed to fetch files" />;
    }

    const filesList: React.ReactNode[] = files.map(({ uri, type }) => {
        return (
            <tr key={`${uri}:${type}`}>
                <td>
                    <a href={uri} target="_blank" rel="noopener noreferrer">
                        {uri}
                    </a>
                </td>
                <td>{type}</td>
            </tr>
        );
    });

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Files</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">File URI</th>
                            <th className="text-muted w-1">File Type</th>
                        </tr>
                    </thead>
                    <tbody className="list">{filesList}</tbody>
                </table>
            </div>
        </div>
    );
}
