import type { ImgHTMLAttributes, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    /** Image source. When empty, the `fallback` is rendered instead. */
    src?: string;
    /** Rendered when `src` is empty or the image fails to load. */
    fallback?: ReactNode;
};

/**
 * Minimal image primitive: renders an `<img>` and swaps in `fallback` when the
 * source is missing or fails to load.
 *
 * It deliberately knows nothing about where the URL comes from — proxying,
 * avatars, "open original" links, etc. are composed on top of it.
 */
export function ImageWithFallback({ src, fallback, alt = '', onError, ...props }: ImageProps) {
    const [failed, setFailed] = useState(false);

    // Reset on source change so a reused element retries the new src instead of
    // staying on the previous one's fallback.
    useEffect(() => setFailed(false), [src]);

    if (!src || failed) {
        return <>{fallback}</>;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            {...props}
            alt={alt}
            onError={(event: SyntheticEvent<HTMLImageElement>) => {
                setFailed(true);
                onError?.(event);
            }}
            src={src}
        />
    );
}
