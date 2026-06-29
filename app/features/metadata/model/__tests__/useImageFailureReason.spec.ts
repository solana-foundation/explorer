import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useImageFailureReason } from '../useImageFailureReason';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useImageFailureReason', () => {
    it('should start idle with no failure', () => {
        const { result } = renderHook(() => useImageFailureReason('/api/metadata/proxy?uri=initial'));

        expect(result.current.failure).toBeUndefined();
        expect(result.current.status).toBe('idle');
    });

    it('should probe the proxy on error and expose the per-status reason', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 413 }));
        const { result } = renderHook(() => useImageFailureReason('/api/metadata/proxy?uri=hook-oversize'));

        act(() => result.current.onImageError());

        await waitFor(() =>
            expect(result.current.failure).toEqual({ reason: 'Image exceeds maximum size', status: 413 }),
        );
        expect(result.current.status).toBe('resolved');
    });

    it('should expose a probing status while the on-error probe is in flight', async () => {
        // A probe that never settles holds the hook in the `probing` state so the
        // in-between (failed, reason-pending) window is observable.
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise<Response>(() => {}));
        const { result } = renderHook(() => useImageFailureReason('/api/metadata/proxy?uri=hook-slow'));

        act(() => result.current.onImageError());

        await waitFor(() => expect(result.current.status).toBe('probing'));
        expect(result.current.failure).toBeUndefined();
    });

    it('should show a generic reason without probing for a non-proxied (cross-origin) src', () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const { result } = renderHook(() => useImageFailureReason('https://example.test/a.png'));

        act(() => result.current.onImageError());

        expect(result.current.failure).toEqual({ reason: 'Image could not be displayed', status: 0 });
        expect(result.current.status).toBe('resolved');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should clear the failure when the src changes', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
        const { result, rerender } = renderHook(({ src }) => useImageFailureReason(src), {
            initialProps: { src: '/api/metadata/proxy?uri=hook-a' },
        });

        act(() => result.current.onImageError());
        await waitFor(() => expect(result.current.failure).toBeDefined());

        rerender({ src: '/api/metadata/proxy?uri=hook-b' });

        expect(result.current.failure).toBeUndefined();
        expect(result.current.status).toBe('idle');
    });
});
