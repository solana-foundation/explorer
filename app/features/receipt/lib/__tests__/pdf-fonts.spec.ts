import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockOkFetch() {
    return vi.fn().mockImplementation(() =>
        Promise.resolve({
            blob: () => Promise.resolve(new Blob(['x'])),
            ok: true,
            status: 200,
        }),
    );
}

beforeEach(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('loadPdfFonts', () => {
    it('should cache and return the same promise on repeated calls', async () => {
        const fetchMock = mockOkFetch();
        vi.stubGlobal('fetch', fetchMock);
        const { loadPdfFonts } = await import('../pdf-fonts');

        const p1 = loadPdfFonts();
        const p2 = loadPdfFonts();

        expect(p1).toBe(p2);
        await p1;
        expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should clear the cache after a rejection and succeed on retry', async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new Error('network down'))
            .mockImplementation(() =>
                Promise.resolve({
                    blob: () => Promise.resolve(new Blob(['x'])),
                    ok: true,
                    status: 200,
                }),
            );
        vi.stubGlobal('fetch', fetchMock);
        const { loadPdfFonts } = await import('../pdf-fonts');

        await expect(loadPdfFonts()).rejects.toThrow('network down');

        const fonts = await loadPdfFonts();
        expect(fonts).toEqual({
            robotoMonoRegular: expect.any(String),
            robotoMonoSemiBold: expect.any(String),
            rubikRegular: expect.any(String),
            rubikSemiBold: expect.any(String),
        });
    });

    it('should throw when fetch returns a non-ok response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob()),
                ok: false,
                status: 404,
            }),
        );
        const { loadPdfFonts } = await import('../pdf-fonts');

        await expect(loadPdfFonts()).rejects.toThrow('404');
    });
});
