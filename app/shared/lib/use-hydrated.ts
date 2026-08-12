'use client';

import { useEffect, useState } from 'react';

// False on the server and through the first client render, true after. For values only the client can know
// (localStorage, `window`): React leaves mismatched attributes stale rather than patching them, so such a
// value has to reach the DOM in a second render instead of the first.
export function useHydrated(): boolean {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
