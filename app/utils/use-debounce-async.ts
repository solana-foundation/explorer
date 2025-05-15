import { useRef } from 'react';

export function useDebouncedAsync<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    delay: number
): (...args: TArgs) => Promise<TResult> {
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pending = useRef<{
        args: TArgs;
        resolve: (val: TResult) => void;
        reject: (err: any) => void;
    } | null>(null);

    return (...args: TArgs) => {
        return new Promise<TResult>((resolve, reject) => {
            if (timeout.current) clearTimeout(timeout.current);

            pending.current = { args, reject, resolve };

            timeout.current = setTimeout(async () => {
                if (pending.current) {
                    const { args, resolve, reject } = pending.current;
                    pending.current = null;
                    try {
                        const result = await fn(...args);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                }
            }, delay);
        });
    };
}
