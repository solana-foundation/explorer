import { describe, expect, it, vi } from 'vitest';

import { isProxiedSrc, probeImageFailure, reasonForStatus } from '../imageFailure';

describe('reasonForStatus', () => {
    it('should map known proxy statuses to friendly copy', () => {
        expect(reasonForStatus(413)).toBe('Image exceeds maximum size');
        expect(reasonForStatus(404)).toBe('Image not found');
        expect(reasonForStatus(415)).toBe('Unsupported image type');
        expect(reasonForStatus(502)).toBe('Image source unavailable');
        expect(reasonForStatus(504)).toBe('Image source timed out');
    });

    it('should fall back to a generic reason for unmapped or success statuses', () => {
        expect(reasonForStatus(418)).toBe('Image could not be displayed');
        expect(reasonForStatus(200)).toBe('Image could not be displayed');
    });
});

describe('isProxiedSrc', () => {
    it('should be true only for the same-origin proxy path', () => {
        expect(isProxiedSrc('/api/metadata/proxy?uri=https%3A%2F%2Fx')).toBe(true);
        expect(isProxiedSrc('https://example.test/a.png')).toBe(false);
        expect(isProxiedSrc('')).toBe(false);
    });
});

describe('probeImageFailure', () => {
    it('should read the status and return the matching reason', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 413 }));

        await expect(probeImageFailure('/api/metadata/proxy?uri=oversize')).resolves.toEqual({
            reason: 'Image exceeds maximum size',
            status: 413,
        });
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        fetchSpy.mockRestore();
    });

    it('should cache a verdict so the same src is probed only once', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
        const src = '/api/metadata/proxy?uri=cached';

        const first = await probeImageFailure(src);
        const second = await probeImageFailure(src);

        expect(first).toEqual(second);
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        fetchSpy.mockRestore();
    });

    it('should resolve to a generic, uncached reason when the status cannot be read', async () => {
        const src = '/api/metadata/proxy?uri=network-error';
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce(new Response(null, { status: 404 }));

        await expect(probeImageFailure(src)).resolves.toEqual({ reason: 'Image could not be displayed', status: 0 });
        // Not cached: a later attempt re-probes and now sees the real status.
        await expect(probeImageFailure(src)).resolves.toEqual({ reason: 'Image not found', status: 404 });
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        fetchSpy.mockRestore();
    });
});
