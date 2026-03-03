import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

// import type { DownloadState } from '../useDownloadReceipt';

describe('useDownloadReceipt', () => {
    let useDownloadReceipt: typeof import('../useDownloadReceipt').useDownloadReceipt;

    beforeEach(async () => {
        vi.useFakeTimers();
        ({ useDownloadReceipt } = await import('../useDownloadReceipt'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should start with idle state', () => {
        const download = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() => useDownloadReceipt(download));
        expect(result.current[0]).toBe('idle');
    });

    it('should transition to downloading then downloaded on success', async () => {
        let resolve: () => void;
        const download = vi.fn().mockReturnValue(
            new Promise<void>(r => {
                resolve = r;
            })
        );

        const { result } = renderHook(() => useDownloadReceipt(download));

        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('downloading');

        await act(async () => {
            resolve!();
        });

        expect(result.current[0]).toBe('downloaded');
    });

    it('should transition to errored on failure', async () => {
        const download = vi.fn().mockRejectedValue(new Error('network error'));
        const { result } = renderHook(() => useDownloadReceipt(download));

        await act(async () => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('errored');
    });

    it('should reset to idle after resetMs', async () => {
        const download = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() => useDownloadReceipt(download, 500));

        await act(async () => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('downloaded');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current[0]).toBe('idle');
    });

    it('should reset to idle after resetMs when errored', async () => {
        const download = vi.fn().mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useDownloadReceipt(download, 500));

        await act(async () => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('errored');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current[0]).toBe('idle');
    });

    it('should ignore clicks while downloading', async () => {
        let resolve: () => void;
        const download = vi.fn().mockReturnValue(
            new Promise<void>(r => {
                resolve = r;
            })
        );

        const { result } = renderHook(() => useDownloadReceipt(download));

        act(() => {
            result.current[1]();
        });

        expect(download).toHaveBeenCalledTimes(1);

        act(() => {
            result.current[1]();
        });

        expect(download).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolve!();
        });
    });

    it('should clean up timeout on unmount', async () => {
        const download = vi.fn().mockResolvedValue(undefined);
        const { result, unmount } = renderHook(() => useDownloadReceipt(download, 1000));

        await act(async () => {
            result.current[1]();
        });

        unmount();

        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });
});
