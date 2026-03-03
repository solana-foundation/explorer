import { useCallback, useEffect, useRef, useState } from 'react';

import type { DownloadReceiptFn } from '../types';

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'errored';

export function useDownloadReceipt(download: DownloadReceiptFn, resetMs = 2000): readonly [DownloadState, () => void] {
    const [state, setState] = useState<DownloadState>('idle');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const scheduleReset = useCallback(() => {
        timeoutRef.current = setTimeout(() => setState('idle'), resetMs);
    }, [resetMs]);

    const trigger = useCallback(() => {
        if (state === 'downloading') return;

        clearTimeout(timeoutRef.current);
        setState('downloading');

        download().then(
            () => {
                setState('downloaded');
                scheduleReset();
            },
            (error: unknown) => {
                console.error('Download failed:', error);
                setState('errored');
                scheduleReset();
            }
        );
    }, [state, download, scheduleReset]);

    return [state, trigger] as const;
}
