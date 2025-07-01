import { Account, NFTData } from '@providers/accounts';
import { isTokenProgramData } from '@providers/accounts';
import ReactJson from 'react-json-view';

import { useCluster } from '@/app/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/providers/compressed-nft';
import { isRedactedTokenAddress } from '@/app/utils/token-info';

export function MetaplexMetadataCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account?.pubkey.toString() ?? '', url });

    const parsedData = account?.data?.parsed;
    if (
        isRedactedTokenAddress(account?.pubkey.toString() ?? '') ||
        !parsedData ||
        !isTokenProgramData(parsedData) ||
        parsedData.parsed.type !== 'mint' ||
        !parsedData.nftData
    ) {
        if (compressedNft && compressedNft.compression.compressed) {
            return <CompressedMetadataCard compressedNft={compressedNft} />;
        }
        return onNotFound();
    }
    return <NormalMetadataCard metadata={parsedData.nftData.metadata} />;
}

function NormalMetadataCard({ metadata }: { metadata: NFTData['metadata'] }) {
    return (
        <>
            <div className="card">
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <h3 className="card-header-title">Metaplex Metadata</h3>
                        </div>
                    </div>
                </div>

                <div className="card metadata-json-viewer m-4">
                    <ReactJson src={metadata} theme={'solarized'} style={{ padding: 25 }} name={false} />
                </div>
            </div>
        </>
    );
}

function CompressedMetadataCard({ compressedNft }: { compressedNft: CompressedNft }) {
    const metadataJson = useMetadataJsonLink(compressedNft.content.json_uri);
    return <NormalMetadataCard metadata={metadataJson} />;
}
