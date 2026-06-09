import { useCallback, useEffect, useRef, useState } from 'react';

import { type ImageFailure, isProxiedSrc, probeImageFailure } from '../lib/imageFailure';

/**
 * Lifecycle of the failure-reason lookup:
 * - `idle`     — no load failure yet.
 * - `probing`  — the image failed and the same-origin re-`fetch` that reads the
 *                reason is in flight. Lets callers show a loading affordance
 *                instead of a blank/reasonless gap — the probe can take up to the
 *                proxy's upstream timeout (a 504 isn't always a browser-cache hit).
 * - `resolved` — `failure` is known (probed status, or the generic reason).
 */
export type ImageFailureStatus = 'idle' | 'probing' | 'resolved';

/**
 * Tracks why a proxied image failed to load. A browser `<img>` can't read the
 * HTTP status, so on its `onError` this re-fetches the same `src` to learn the
 * reason (often served from the browser cache the failed `<img>` request primed,
 * but a 504 can re-incur the upstream timeout). Returns the verdict, a `status`
 * so callers can render a pending state while the probe runs, and the `onError`
 * handler to wire onto the image.
 *
 * The verdict resets when `src` changes, and an in-flight probe is aborted on
 * unmount or `src` change so it never sets state for a stale source.
 */
export function useImageFailureReason(src: string): {
    failure: ImageFailure | undefined;
    status: ImageFailureStatus;
    onImageError: () => void;
} {
    const [failure, setFailure] = useState<ImageFailure>();
    const [status, setStatus] = useState<ImageFailureStatus>('idle');
    const abortRef = useRef<AbortController | null>(null);

    // A new source clears any prior verdict and cancels an in-flight probe.
    useEffect(() => {
        setFailure(undefined);
        setStatus('idle');
        return () => abortRef.current?.abort();
    }, [src]);

    const onImageError = useCallback(() => {
        // No readable status off-origin — resolve to the generic reason, no probe.
        if (!isProxiedSrc(src)) {
            setFailure({ reason: 'Image could not be displayed', status: 0 });
            setStatus('resolved');
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setStatus('probing');

        void probeImageFailure(src, controller.signal).then(result => {
            if (controller.signal.aborted) return;
            setFailure(result);
            setStatus('resolved');
        });
    }, [src]);

    return { failure, onImageError, status };
}
