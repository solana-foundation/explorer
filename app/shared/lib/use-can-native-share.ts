'use client';

import { useEffect, useState } from 'react';

export function useCanNativeShare() {
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        // Heuristic for detecting a mobile device: coarse pointer (touch) and no hover support
        const isMobileDevice =
            globalThis.matchMedia('(pointer: coarse)').matches && globalThis.matchMedia('(hover: none)').matches;

        setCanNativeShare(
            typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && isMobileDevice
        );
    }, []);

    return canNativeShare;
}
