import { ProxiedImage } from '@/app/features/metadata';

export const NFTImageContent = ({ uri }: { uri?: string }) => {
    return (
        <div style={{ maxHeight: 200, width: 150 }}>
            {/* Reserve a fixed 150×150 box so the layout doesn't shift while the
                image loads; `object-fit: contain` keeps the aspect ratio inside it. */}
            <ProxiedImage
                alt="nft"
                className="e-rounded"
                height={150}
                showOriginalLink
                style={{ objectFit: 'contain' }}
                uri={uri}
                width={150}
            />
        </div>
    );
};
