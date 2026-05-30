import type { NftJson } from '@entities/nft';
import lowContrastSolanalogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import { PublicKey } from '@solana/web3.js';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { getSafeExternalUrl } from '@/app/shared/lib/safe-external-url';
import { isEnvEnabled } from '@/app/utils/env';

import { InfoTooltip } from './InfoTooltip';

const isDisplayEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_VIEW_ORIGINAL_DISPLAY_ENABLED);

export const MAX_TIME_LOADING_IMAGE = 5000; /* 5 seconds */
const UNSUPPORTED_EXTERNAL_RESOURCE_TOOLTIP =
    'Original asset links are only enabled for http and https URLs. Unsupported URI schemes are shown as disabled.';

const ViewOriginalArtContentLink = ({ src }: { src: string }) => {
    const safeSrc = getSafeExternalUrl(src);

    if (!isDisplayEnabled) {
        return null;
    }

    return (
        <h6 className="header-pretitle d-flex mt-2 justify-content-center">
            {safeSrc ? (
                <a href={safeSrc} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center">
                    <div>VIEW ORIGINAL</div>
                    <div className="d-flex">
                        <InfoTooltip right text="Clicking this link will open an external resource" />
                    </div>
                </a>
            ) : (
                <span
                    aria-disabled="true"
                    className="d-flex align-items-center text-muted"
                    data-testid="view-original-disabled"
                >
                    <div>VIEW ORIGINAL</div>
                    <div className="d-flex">
                        <InfoTooltip right text={UNSUPPORTED_EXTERNAL_RESOURCE_TOOLTIP} />
                    </div>
                </span>
            )}
        </h6>
    );
};

export const NFTImageContent = ({ uri }: { uri?: string }) => {
    return (
        <div style={{ maxHeight: 200, width: 150 }}>
            <div className="rounded mx-auto d-block" style={{ overflow: 'hidden' }}>
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
