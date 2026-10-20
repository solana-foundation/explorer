import { Skeleton } from '@components/shared/ui/skeleton';
import Link from 'next/link';
import type { Ref } from 'react';

import { ProxiedImage } from '@/app/features/metadata';

import type { NftokenMetadataState } from '../model/use-nftoken-metadata';

const IMAGE_SIZE = 80;

export function BaseNftokenTile({
    href,
    metadata,
    ref,
}: {
    href: string;
    metadata: NftokenMetadataState;
    ref?: Ref<HTMLDivElement>;
}) {
    return (
        <div ref={ref} className="flex flex-col items-center justify-center gap-4">
            {metadata.kind === 'loading' ? (
                <Skeleton style={{ height: IMAGE_SIZE, width: IMAGE_SIZE }} />
            ) : (
                <ProxiedImage
                    alt="nft"
                    height={IMAGE_SIZE}
                    showOriginalLink
                    uri={metadata.kind === 'loaded' ? metadata.metadata.image : undefined}
                    width={IMAGE_SIZE}
                />
            )}
            <Link href={href}>{tileName(metadata)}</Link>
        </div>
    );
}

function tileName(metadata: NftokenMetadataState): string {
    switch (metadata.kind) {
        case 'loading':
            return 'Loading...';
        case 'loaded':
            return metadata.metadata.name ?? 'No Name';
        case 'unavailable':
            return 'No Name';
        case 'failed':
            return 'Failed to load metadata';
    }
}
