'use client';

import { useLayoutEffect, useState } from 'react';

/** Returns true when the user (or capture environment) requests reduced motion. */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useLayoutEffect(() => {
        const mql = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mql.matches);
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    return reduced;
}
