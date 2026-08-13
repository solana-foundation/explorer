import { useCallback, useEffect, useRef, useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';

export type CopyState = 'copy' | 'copied' | 'errored';

export function useCopyToClipboard(resetMs = 2000): readonly [CopyState, (text: string) => void] {
    const [state, setState] = useState<CopyState>('copy');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const scheduleReset = useCallback(
        (ms: number) => {
            timeoutRef.current = setTimeout(() => setState('copy'), ms);
        },
        [setState],
    );

    // A failure the user glanced past means pasting stale clipboard content, so it lingers longer than a success.
    const failWith = useCallback(
        (error: Error) => {
            Logger.error(error);
            setState('errored');
            scheduleReset(resetMs * 3);
        },
        [resetMs, scheduleReset],
    );

    const copy = useCallback(
        (text: string) => {
            clearTimeout(timeoutRef.current);

            if (typeof navigator === 'undefined' || !navigator.clipboard) {
                failWith(new Error('Clipboard API is not available'));
                return;
            }

            navigator.clipboard.writeText(text).then(
                () => {
                    setState('copied');
                    scheduleReset(resetMs);
                },
                (error: unknown) => failWith(new Error('Clipboard write failed', { cause: error })),
            );
        },
        [failWith, resetMs, scheduleReset],
    );

    return [state, copy] as const;
}
