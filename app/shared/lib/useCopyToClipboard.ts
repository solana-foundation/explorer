import { useCallback, useEffect, useRef, useState } from 'react';

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

            navigator.clipboard.writeText(text).then(
                () => {
                    setState('copied');
                    scheduleReset();
                },
                () => {
                    setState('errored');
                    scheduleReset();
                }
            );
        },
        [scheduleReset]
    );

    return [state, copy] as const;
}
