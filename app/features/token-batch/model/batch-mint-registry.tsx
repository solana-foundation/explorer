'use client';

import React from 'react';

import type { MintInfo } from '../lib/types';

type BatchMintRegistry = {
    // Register a discovered mint from a resolved sub-instruction.
    register: (mint: string, decimals: number) => void;
    // Get the unique mint if all resolved sub-instructions agree on one mint.
    // Returns undefined if no mints registered or if there are multiple different mints.
    getUniqueMint: () => MintInfo | undefined;
};

const BatchMintRegistryContext = React.createContext<BatchMintRegistry | undefined>(undefined);

export function BatchMintRegistryProvider({ children }: { children: React.ReactNode }) {
    const mintsRef = React.useRef(new Map<string, number>());
    const [revision, setRevision] = React.useState(0);

    const register = React.useCallback((mint: string, decimals: number) => {
        const current = mintsRef.current;
        if (current.get(mint) === decimals) return;
        current.set(mint, decimals);
        setRevision(r => r + 1);
    }, []);

    const getUniqueMint = React.useCallback((): MintInfo | undefined => {
        const entries = [...mintsRef.current.entries()];
        if (entries.length !== 1) return undefined;
        const [mint, decimals] = entries[0];
        return { decimals, mint };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- revision triggers recalculation
    }, [revision]);

    const value = React.useMemo(() => ({ getUniqueMint, register }), [getUniqueMint, register]);

    return <BatchMintRegistryContext.Provider value={value}>{children}</BatchMintRegistryContext.Provider>;
}

export function useBatchMintRegistry(): BatchMintRegistry | undefined {
    return React.useContext(BatchMintRegistryContext);
}
