'use client';

import { useEffect, useState } from 'react';

// Matches Tailwind breakpoints defined in tailwind.config.ts
const BREAKPOINTS = {
    lg: 992,
    md: 768,
    sm: 576,
    xl: 1200,
    xxl: 1400,
    xs: 375,
} as const;

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

/** Returns true when viewport width >= the given breakpoint */
export function useBreakpoint() {
    const isXs = useMediaQuery(`(min-width: ${BREAKPOINTS.xs}px)`);
    const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
    const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
    const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
    const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
    const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS.xxl}px)`);

    return { is2xl, isLg, isMd, isSm, isXl, isXs };
}
