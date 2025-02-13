import { Account, NFTData } from '@providers/accounts';
import { isTokenProgramData } from '@providers/accounts';
import ReactJson from 'react-json-view';

import { useCluster } from '@/app/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/providers/compressed-nft';

export function MetaplexMetadataCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account?.pubkey.toString() ?? '', url });
    console.log(compressedNft);

    const parsedData = account?.data?.parsed;
    if (!parsedData || !isTokenProgramData(parsedData) || parsedData.parsed.type !== 'mint' || !parsedData.nftData) {
        if (compressedNft && compressedNft.compression.compressed) {
            return <CompressedMetadataCard compressedNft={compressedNft} />;
        }
        return onNotFound();
    }

    // Here we grossly stringify and parse the metadata to avoid the bigints which ReactJsonView does not support.
    const json = JSON.parse(JSON.stringify(parsedData.nftData.metadata, (_, v) => typeof v === 'bigint' ? v.toString() : v));

    return <NormalMetadataCard json={json} />;
}

function NormalMetadataCard({ json }: { json: any }) {
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
                    <ReactJson src={json} theme={'solarized'} style={{ padding: 25 }} />
                </div>
            </div>
        </>
    );
}

function CompressedMetadataCard({ compressedNft }: { compressedNft: CompressedNft }) {
    console.log("is compressed", compressedNft.compression.compressed);
    const metadataJson = useMetadataJsonLink(compressedNft.content.json_uri);
    console.log("metadata json", metadataJson);
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
                    <ReactJson src={metadataJson} theme={'solarized'} style={{ padding: 25 }} name={false} />
                </div>
            </div>
        </>
    );
}
