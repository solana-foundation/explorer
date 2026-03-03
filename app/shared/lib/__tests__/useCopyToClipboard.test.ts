import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

describe('useCopyToClipboard', () => {
    let useCopyToClipboard: typeof import('../useCopyToClipboard').useCopyToClipboard;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.stubGlobal('navigator', {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });

        ({ useCopyToClipboard } = await import('../useCopyToClipboard'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should start with copy state', () => {
        const { result } = renderHook(() => useCopyToClipboard());
        expect(result.current[0]).toBe('copy');
    });

    it('should transition to copied on success', async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current[1]('hello');
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
        expect(result.current[0]).toBe('copied');
    });

    it('should transition to errored on failure', async () => {
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));

        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current[1]('hello');
        });

        expect(result.current[0]).toBe('errored');
    });

    it('should reset to copy after resetMs', async () => {
        const { result } = renderHook(() => useCopyToClipboard(500));

        await act(async () => {
            result.current[1]('hello');
        });

        expect(result.current[0]).toBe('copied');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current[0]).toBe('copy');
    });

    it('should clear previous timeout on rapid calls', async () => {
        const { result } = renderHook(() => useCopyToClipboard(1000));

        await act(async () => {
            result.current[1]('first');
        });

        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current[0]).toBe('copied');

        await act(async () => {
            result.current[1]('second');
        });

        act(() => {
            vi.advanceTimersByTime(800);
        });

        // Still copied — the second call's timeout hasn't elapsed yet
        expect(result.current[0]).toBe('copied');

        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(result.current[0]).toBe('copy');
    });

    it('should clean up timeout on unmount', async () => {
        const { result, unmount } = renderHook(() => useCopyToClipboard(1000));

        await act(async () => {
            result.current[1]('hello');
        });

        unmount();

        // Advancing timers after unmount should not throw
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });
});
