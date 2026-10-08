import { InfoTooltip } from '@components/common/InfoTooltip';
import { LoadingArtPlaceholder } from '@components/common/LoadingArtPlaceholder';
import { NFTImageContent } from '@components/common/NFTArt';

import { Badge } from '@/app/components/shared/ui/badge';

import type { NftokenAccount } from '../lib/nftoken-accounts';
import type { NftokenMetadataState } from '../model/use-nftoken-metadata';

const COPY: Record<NftokenAccount['kind'], { label: string; missingName: string; mutable: string }> = {
    collection: {
        label: 'NFToken Collection',
        missingName: 'No collection name was found',
        mutable: 'The authority of this Collection can update the Metadata and add NFTs.',
    },
    nft: {
        label: 'NFToken NFT',
        missingName: 'No NFT name was found',
        mutable: 'The authority of this NFT can update the Metadata.',
    },
};

const IMMUTABLE = 'The Metadata cannot be updated by anyone.';
const METADATA_FAILED = 'Failed to load metadata';

export function BaseNftokenHeader({
    kind,
    metadata,
    mutable,
}: {
    kind: NftokenAccount['kind'];
    metadata: NftokenMetadataState;
    mutable: boolean;
}) {
    if (metadata.kind === 'loading') return <LoadingArtPlaceholder />;

    const copy = COPY[kind];
    const loaded = metadata.kind === 'loaded' ? metadata.metadata : undefined;

    return (
        <div className="-mx-3 flex flex-wrap">
            <div className="ml-1.5 flex flex-none items-center px-3">
                <NFTImageContent uri={loaded?.image} />
            </div>

            <div className="mb-3 mt-3 min-w-0 flex-1 px-3">
                <h6 className="ml-[3px] uppercase tracking-[0.08em] text-dk-gray-700">{copy.label}</h6>
                <div className="flex items-center">
                    <h2 className="mb-0 ml-[3px] items-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {metadata.kind === 'failed' ? METADATA_FAILED : (loaded?.name ?? copy.missingName)}
                    </h2>
                </div>

                <div>
                    <div className="mt-1.5 inline-flex items-center">
                        <Badge ui="dashkit" variant="dark" tone="solid">
                            {mutable ? 'Mutable' : 'Immutable'}
                        </Badge>

                        <InfoTooltip bottom text={mutable ? copy.mutable : IMMUTABLE} />
                    </div>
                </div>
            </div>
        </div>
    );
}
