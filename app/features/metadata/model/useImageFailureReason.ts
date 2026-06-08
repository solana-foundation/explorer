import { useCallback, useEffect, useRef, useState } from 'react';

import { type ImageFailure, isProxiedSrc, probeImageFailure } from '../lib/imageFailure';

/**
 * Tracks why a proxied image failed to load. A browser `<img>` can't read the
 * HTTP status, so on its `onError` this re-fetches the same `src` to learn the
 * reason (cheap: served from the browser cache the failed `<img>` request just
 * primed). Returns the verdict plus the `onError` handler to wire onto the image.
 *
 * The verdict resets when `src` changes, and an in-flight probe is aborted on
 * unmount or `src` change so it never sets state for a stale source.
 */
export function useImageFailureReason(src: string): {
    failure: ImageFailure | undefined;
    onImageError: () => void;
} {
    const [failure, setFailure] = useState<ImageFailure>();
    const abortRef = useRef<AbortController | null>(null);

    // A new source clears any prior verdict and cancels an in-flight probe.
    useEffect(() => {
        setFailure(undefined);
        return () => abortRef.current?.abort();
    }, [src]);

    const onImageError = useCallback(() => {
        // No readable status off-origin — show the generic reason without a probe.
        if (!isProxiedSrc(src)) {
            setFailure({ reason: 'Image could not be displayed', status: 0 });
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        void probeImageFailure(src, controller.signal).then(result => {
            if (!controller.signal.aborted) setFailure(result);
        });
    }, [src]);

    return { failure, onImageError };
}
