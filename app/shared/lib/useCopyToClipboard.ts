import { useCallback, useEffect, useRef, useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';

export type CopyState = 'copy' | 'copied' | 'errored';

export function useCopyToClipboard(resetMs = 2000): readonly [CopyState, (text: string) => void] {
    const [state, setState] = useState<CopyState>('copy');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const scheduleReset = useCallback(() => {
        timeoutRef.current = setTimeout(() => setState('copy'), resetMs);
    }, [resetMs]);

    const copy = useCallback(
        (text: string) => {
            clearTimeout(timeoutRef.current);

            if (typeof navigator === 'undefined' || !navigator.clipboard) {
                Logger.error(new Error('Clipboard API is not available'));
                setState('errored');
                scheduleReset();
                return;
            }

            navigator.clipboard.writeText(text).then(
                () => {
                    setState('copied');
                    scheduleReset();
                },
                (error: unknown) => {
                    Logger.error(new Error('Clipboard write failed', { cause: error }));
                    setState('errored');
                    scheduleReset();
                }
            );
        },
        [scheduleReset]
    );

    return [state, copy] as const;
}
