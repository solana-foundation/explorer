import type { NftJson } from '@entities/nft';
import lowContrastSolanalogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { isEnvEnabled } from '@/app/utils/env';

import { InfoTooltip } from './InfoTooltip';

const isDisplayEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_VIEW_ORIGINAL_DISPLAY_ENABLED);

export const MAX_TIME_LOADING_IMAGE = 5000; /* 5 seconds */

const ViewOriginalArtContentLink = ({ src }: { src: string }) => {
    if (!src) {
        return null;
    }

    return (
        <h6 className="header-pretitle e-mt-1.5 e-flex e-justify-center">
            {!isDisplayEnabled ? null : (
                <Link href={src} target="_blank" className="e-flex e-items-center">
                    <div>VIEW ORIGINAL</div>
                    <div className="e-flex">
                        <InfoTooltip right text="Clicking this link will open an external resource" />
                    </div>
                </Link>
            )}
        </h6>
    );
};

export const NFTImageContent = ({ uri }: { uri?: string }) => {
    return (
        <div style={{ maxHeight: 200, width: 150 }}>
            <div className="mx-auto e-block e-rounded-dk" style={{ overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="nft" src={uri ? getProxiedUri(uri) : lowContrastSolanalogo.src} width="100%" />
            </div>
            {uri && <ViewOriginalArtContentLink src={uri} />}
        </div>
    );
};

export const ArtContent = ({
    pubkey,
    uri,
    data,
}: {
    pubkey?: PublicKey | string;
    uri?: string;
    data: NftJson | undefined;
}) => {
    if (pubkey && data) {
        uri = data.image;
    }

    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <NFTImageContent uri={uri} />
        </div>
    );
};
