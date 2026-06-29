import solanaLogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import type { ReactNode } from 'react';

import { ExternalResourceLink, type ImageProps, ImageWithFallback } from '@/app/components/shared/ui/image';
import { Skeleton } from '@/app/components/shared/ui/skeleton';

import { type ImageFailure } from '../lib/imageFailure';
import { useImageFailureReason } from '../model/useImageFailureReason';
import { getProxiedUri as defaultGetProxiedUri } from '../utils';

export type ProxiedImageProps = Omit<ImageProps, 'src' | 'fallback'> & {
    /** Original on-chain URI; routed through the metadata proxy when enabled. */
    uri?: string;
    /**
     * Override the default fallback (a Solana logo sized to the image's slot,
     * with the failure reason as a tooltip). Pass a render function to receive
     * the resolved {@link ImageFailure} — e.g. to show the reason as visible
     * text; it's re-invoked once the reason is known.
     */
    fallback?: ReactNode | ((failure: ImageFailure | undefined) => ReactNode);
    /**
     * Render a "View original" link to the {@link ProxiedImageProps.uri} beneath
     * the image, in every state. The escape hatch for when the proxy rejects an
     * oversize image (a `413`) or the upstream is unreachable — a browser `<img>`
     * can't read the HTTP status, so the link is offered rather than gated on a
     * load failure. Off by default.
     *
     * The link always targets {@link ProxiedImageProps.uri} (the same source the
     * image loads from), so it no-ops gracefully when there's no `uri` — nothing
     * to show, nothing to link to. Safe to pass unconditionally; kept a plain
     * boolean rather than a `uri`-coupled union so callers with an optional `uri`
     * stay a single element.
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
 * Off-chain image fetched through the metadata proxy. While it loads, a
 * {@link Skeleton} sized to the image's slot holds the space; on any load
 * failure it degrades to a Solana-logo placeholder that inherits the image's
 * own className and box, so the fallback matches the slot's shape (a
 * rounded-full avatar gets a round logo).
 *
 * Since a browser `<img>` can't read the HTTP status, on failure the component
 * re-fetches the proxied URL to learn why (413 oversize, 404, 415, …) and
 * surfaces it as a tooltip on the default fallback — or via a `fallback` render
 * function. That probe can take up to the proxy's upstream timeout (a 504 isn't
 * always a browser-cache hit), so the loading skeleton is held until the reason
 * resolves — the failure state appears once with its reason rather than after a
 * blank gap. Pass `showOriginalLink` to add a "View original" escape-hatch link.
 *
 * This is the only metadata-aware layer; it composes the proxy-agnostic
 * primitives from `shared/ui/image`.
 */
export function ProxiedImage({
    uri,
    fallback,
    placeholder,
    showOriginalLink = false,
    getProxiedUri = defaultGetProxiedUri,
    onError,
    ...props
}: ProxiedImageProps) {
    const src = uri ? getProxiedUri(uri) : '';
    const { failure, onImageError, status } = useImageFailureReason(src);

    // Reuse the image's className/box so the skeleton matches its slot and shape
    // (e.g. a rounded-full avatar gets a round skeleton). Used both while the
    // image loads and while the on-error reason probe is in flight.
    const loadingPlaceholder = placeholder ?? (
        <Skeleton className={props.className} style={{ height: props.height, width: props.width, ...props.style }} />
    );

    const failureFallback =
        typeof fallback === 'function'
            ? fallback(failure)
            : (fallback ?? <SolanaLogoFallback {...props} failure={failure} />);

    // While the on-error probe is determining *why* the image failed (it can take
    // up to the proxy's upstream timeout for a 504), keep the loading placeholder
    // up rather than flashing a reasonless fallback. The failure state then
    // appears once, fully formed with its reason, and the wait isn't a blank gap.
    const resolvedFallback = status === 'probing' ? loadingPlaceholder : failureFallback;

    const image = (
        <ImageWithFallback
            {...props}
            fallback={resolvedFallback}
            // Learn why the image failed (the `<img>` can't read the status),
            // then forward to any consumer-supplied onError.
            onError={event => {
                onImageError();
                onError?.(event);
            }}
            placeholder={loadingPlaceholder}
            src={src}
        />
    );

    if (!showOriginalLink) {
        return image;
    }

    return (
        <div className="inline-flex flex-col items-center gap-2">
            {image}
            {uri ? <ExternalResourceLink detail={failure?.reason} href={uri} /> : undefined}
        </div>
    );
}

// The default fallback reuses the image's own slot — same className, box, and
// inline style — so it inherits the avatar's shape; only the source swaps to the
// Solana logo. The failure reason rides along as a tooltip, which works at any
// size (including a 16px avatar where visible text wouldn't fit).
function SolanaLogoFallback({ className, failure, height, style, width }: ImageProps & { failure?: ImageFailure }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            // On failure the logo isn't decorative — it stands in for the missing
            // image and carries the reason, so announce it (the `title` is only a
            // sighted hover hint). Empty alt only when there's nothing to report
            // (e.g. no URI), where it really is a decorative placeholder.
            alt={failure?.reason ?? ''}
            className={className}
            height={height}
            src={solanaLogo.src}
            style={style}
            title={failure?.reason}
            width={width}
        />
    );
}
