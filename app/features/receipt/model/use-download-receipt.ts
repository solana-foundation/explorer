import { useCallback, useEffect, useRef, useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import type { DownloadReceiptFn } from '../types';

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'errored';

export function useDownloadReceipt(download: DownloadReceiptFn, resetMs = 2000): readonly [DownloadState, () => void] {
    const [state, setState] = useState<DownloadState>('idle');
    const stateRef = useRef<DownloadState>('idle');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const scheduleReset = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            stateRef.current = 'idle';
            setState('idle');
        }, resetMs);
    }, [resetMs]);

    const trigger = useCallback(() => {
        if (stateRef.current === 'downloading') return;

        clearTimeout(timeoutRef.current);
        stateRef.current = 'downloading';
        setState('downloading');

        download().then(
            () => {
                if (!mountedRef.current) return;
                stateRef.current = 'downloaded';
                setState('downloaded');
                scheduleReset();
            },
            (error: unknown) => {
                if (!mountedRef.current) return;
                Logger.error(new Error('Download failed', { cause: error }));
                stateRef.current = 'errored';
                setState('errored');
                scheduleReset();
            },
        );
    }, [download, scheduleReset]);

    return [state, trigger] as const;
}
