'use client';

import { useEffect, useState } from 'react';

import { breakpoints } from '@/tailwind.config';

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = globalThis.matchMedia(query);
        setMatches(mql.matches);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

function bp(name: string): number {
    const value = breakpoints.get(name);
    if (value === undefined) throw new Error(`Unknown breakpoint: ${name}`);
    return value;
}

/** Returns true when viewport width >= the given breakpoint */
export function useBreakpoint() {
    const isXs = useMediaQuery(`(min-width: ${bp('xs')}px)`);
    const isSm = useMediaQuery(`(min-width: ${bp('sm')}px)`);
    const isMd = useMediaQuery(`(min-width: ${bp('md')}px)`);
    const isLg = useMediaQuery(`(min-width: ${bp('lg')}px)`);
    const isXl = useMediaQuery(`(min-width: ${bp('xl')}px)`);
    const is2xl = useMediaQuery(`(min-width: ${bp('xxl')}px)`);

    return { is2xl, isLg, isMd, isSm, isXl, isXs };
}
