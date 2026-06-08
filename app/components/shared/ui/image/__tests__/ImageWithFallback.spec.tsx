import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImageWithFallback } from '../ImageWithFallback';

// Temporarily make every <img> report a finished load (`complete` true with the
// given dimensions) to simulate a cached image whose load/error already fired
// before React could bind its handlers. Restores the native getters after.
function withCompleteImages(naturalWidth: number, run: () => void) {
    const proto = HTMLImageElement.prototype;
    const complete = Object.getOwnPropertyDescriptor(proto, 'complete');
    const width = Object.getOwnPropertyDescriptor(proto, 'naturalWidth');
    Object.defineProperty(proto, 'complete', { configurable: true, get: () => true });
    Object.defineProperty(proto, 'naturalWidth', { configurable: true, get: () => naturalWidth });
    try {
        run();
    } finally {
        if (complete) Object.defineProperty(proto, 'complete', complete);
        if (width) Object.defineProperty(proto, 'naturalWidth', width);
    }
}

describe('ImageWithFallback', () => {
    it('should render the fallback (and no <img>) when src is empty', () => {
        render(<ImageWithFallback fallback={<span data-testid="fallback" />} />);

        expect(screen.getByTestId('fallback')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should swap in the fallback when the image fails to load', () => {
        render(<ImageWithFallback alt="pic" fallback={<span data-testid="fallback" />} src="https://x/a.png" />);

        fireEvent.error(screen.getByAltText('pic'));

        expect(screen.getByTestId('fallback')).toBeInTheDocument();
        expect(screen.queryByAltText('pic')).not.toBeInTheDocument();
    });

    it('should show the placeholder until load, then swap it out', () => {
        render(<ImageWithFallback alt="pic" placeholder={<span data-testid="placeholder" />} src="https://x/a.png" />);

        // Placeholder holds the slot while the <img> stays mounted but hidden so
        // it can still fetch.
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(screen.getByAltText('pic')).toHaveStyle({ display: 'none' });

        fireEvent.load(screen.getByAltText('pic'));

        expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
        expect(screen.getByAltText('pic')).not.toHaveStyle({ display: 'none' });
    });

    it('should retry a new src after a failure instead of staying on the fallback', () => {
        const { rerender } = render(
            <ImageWithFallback alt="pic" fallback={<span data-testid="fallback" />} src="https://x/a.png" />,
        );
        fireEvent.error(screen.getByAltText('pic'));
        expect(screen.getByTestId('fallback')).toBeInTheDocument();

        // The new src resets the failed state during render, so the <img> mounts
        // again immediately rather than lingering on the previous src's fallback.
        rerender(<ImageWithFallback alt="pic" fallback={<span data-testid="fallback" />} src="https://x/b.png" />);

        expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
        expect(screen.getByAltText('pic')).toHaveAttribute('src', 'https://x/b.png');
    });

    it('should clear the placeholder and notify onLoad for an image already complete before onLoad binds', () => {
        const onLoad = vi.fn();
        withCompleteImages(10, () => {
            render(
                <ImageWithFallback
                    alt="pic"
                    onLoad={onLoad}
                    placeholder={<span data-testid="placeholder" />}
                    src="https://x/a.png"
                />,
            );

            // No load event fired, yet the cached image is already shown — and the
            // recovered event still runs the consumer's handler (not just state).
            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
            expect(screen.getByAltText('pic')).not.toHaveStyle({ display: 'none' });
            expect(onLoad).toHaveBeenCalledTimes(1);
        });
    });

    it('should fall back and notify onError for an image already errored before onError binds (complete, zero dimensions)', () => {
        const onError = vi.fn();
        withCompleteImages(0, () => {
            render(
                <ImageWithFallback
                    alt="pic"
                    fallback={<span data-testid="fallback" />}
                    onError={onError}
                    placeholder={<span data-testid="placeholder" />}
                    src="https://x/a.png"
                />,
            );

            expect(screen.getByTestId('fallback')).toBeInTheDocument();
            expect(screen.queryByAltText('pic')).not.toBeInTheDocument();
            // Consumers that learn *why* it failed (e.g. ProxiedImage's probe) rely
            // on onError firing even when the original event was missed.
            expect(onError).toHaveBeenCalledTimes(1);
        });
    });
});
