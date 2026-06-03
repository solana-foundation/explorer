import solanaLogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import type { CSSProperties, ReactNode } from 'react';

import { ExternalResourceLink, type ImageProps, ImageWithFallback } from '@/app/components/shared/ui/image';

import { getProxiedUri as defaultGetProxiedUri } from '../utils';

export type ProxiedImageProps = Omit<ImageProps, 'src' | 'fallback'> & {
    /** Original on-chain URI; routed through the metadata proxy when enabled. */
    uri?: string;
    /** Override the default fallback (Solana logo + "view original" link). */
    fallback?: ReactNode;
    /**
     * Always render the "view original" link beneath the image, not only when
     * it fails to load. The default fallback degrades to a logo-only placeholder
     * so the link is never shown twice.
     */
    showOriginalLink?: boolean;
    /**
     * URI → proxied-src resolver. Injected so it can be swapped in tests and
     * Storybook (where there's no proxy backend) — defaults to the real
     * {@link defaultGetProxiedUri}.
     */
    getProxiedUri?: (uri: string) => string;
};

/**
 * Off-chain image fetched through the metadata proxy. On any load failure it
 * degrades to a Solana-logo placeholder with an always-available "view original"
 * link to the source — the escape hatch when the proxy rejects an oversize image
 * (a `413`) or the upstream is unreachable. A browser `<img>` can't read the HTTP
 * status, so one fallback covers every cause.
 *
 * This is the only metadata-aware layer; it composes the proxy-agnostic
 * primitives from `shared/ui/image`.
 */
export function ProxiedImage({
    uri,
    fallback,
    showOriginalLink = false,
    getProxiedUri = defaultGetProxiedUri,
    ...props
}: ProxiedImageProps) {
    const image = (
        <ImageWithFallback
            {...props}
            fallback={
                fallback ?? (
                    <ProxiedImageFallback
                        style={{ height: props.height, width: props.width, ...props.style }}
                        // The link is rendered below for every state, so keep the
                        // fallback logo-only to avoid showing it twice.
                        uri={showOriginalLink ? undefined : uri}
                    />
                )
            }
            src={uri ? getProxiedUri(uri) : ''}
        />
    );

    if (!showOriginalLink) {
        return image;
    }

    return (
        <div className="e-flex e-flex-col e-items-center e-gap-2">
            {image}
            {uri ? <ExternalResourceLink href={uri} /> : undefined}
        </div>
    );
}

function ProxiedImageFallback({ uri, style }: { uri?: string; style?: CSSProperties }) {
    return (
        <div className="e-flex e-flex-col e-items-center e-justify-center e-gap-2" style={style}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="e-max-h-full e-w-full e-object-contain" src={solanaLogo.src} />
            {uri ? <ExternalResourceLink href={uri} /> : undefined}
        </div>
    );
}
