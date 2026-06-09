import type { ImgHTMLAttributes, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    /** Image source. When empty, the `fallback` is rendered instead. */
    src?: string;
    /** Rendered when `src` is empty or the image fails to load. */
    fallback?: ReactNode;
    /**
     * Rendered in the image's place while it loads, then swapped out the moment
     * it's ready. Opt-in — omit it to keep the bare load-then-show behavior.
     */
    placeholder?: ReactNode;
};

/**
 * Minimal image primitive: renders an `<img>` and swaps in `fallback` when the
 * source is missing or fails to load. When given a `placeholder`, it shows that
 * until the image finishes loading.
 *
 * It deliberately knows nothing about where the URL comes from — proxying,
 * avatars, "open original" links, etc. are composed on top of it.
 */
export function ImageWithFallback({ src, fallback, placeholder, alt = '', onError, onLoad, ...props }: ImageProps) {
    const [failed, setFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    // Whether a load/error has already been handled for the current src — guards
    // the recovery dispatch below and any duplicate native event from settling
    // (and re-notifying the consumer) twice.
    const settledRef = useRef(false);

    // Reset on source change *during render* (not in an effect) so a reused
    // element mounts the new src with clean state in the same commit. An effect
    // resets after paint, which leaves one frame showing the previous src's
    // fallback/placeholder.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setFailed(false);
        setLoaded(false);
        settledRef.current = false;
    }

    // A cached image can finish loading before React binds onLoad/onError —
    // notably during SSR hydration — dropping the event and pinning the
    // placeholder on (the <img> stays display:none) forever. The completed DOM
    // node still records the outcome, so re-dispatch the missed event: this runs
    // the real handlers (state *and* any consumer onLoad/onError, e.g. a failure
    // probe), rather than just flipping state behind the consumer's back.
    useEffect(() => {
        const img = imgRef.current;
        if (!img || !img.complete || settledRef.current) return;
        img.dispatchEvent(new Event(img.naturalWidth > 0 ? 'load' : 'error'));
    }, [src]);

    if (!src || failed) {
        return <>{fallback}</>;
    }

    // Keep the <img> mounted while the placeholder shows so it can still fetch
    // and fire onLoad/onError — `display: none` images still load.
    const showPlaceholder = Boolean(placeholder) && !loaded;

    return (
        <>
            {showPlaceholder && placeholder}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                {...props}
                ref={imgRef}
                alt={alt}
                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                    if (settledRef.current) return;
                    settledRef.current = true;
                    setFailed(true);
                    onError?.(event);
                }}
                onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                    if (settledRef.current) return;
                    settledRef.current = true;
                    setLoaded(true);
                    onLoad?.(event);
                }}
                src={src}
                style={showPlaceholder ? { ...props.style, display: 'none' } : props.style}
            />
        </>
    );
}
