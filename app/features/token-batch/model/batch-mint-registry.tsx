'use client';

import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { MintInfo } from '../lib/types';

type BatchMintRegistry = {
    // Register a discovered mint from a resolved sub-instruction.
    register: (mint: string, decimals: number) => void;
    // Get the unique mint if all resolved sub-instructions agree on one mint.
    // Returns undefined if no mints registered or if there are multiple different mints.
    getUniqueMint: () => MintInfo | undefined;
};

const BatchMintRegistryContext = createContext<BatchMintRegistry | undefined>(undefined);

export function BatchMintRegistryProvider({ children }: { children: ReactNode }) {
    const mintsRef = useRef(new Map<string, number>());
    const [revision, setRevision] = useState(0);

    const register = useCallback((mint: string, decimals: number) => {
        const current = mintsRef.current;
        if (current.get(mint) === decimals) return;
        current.set(mint, decimals);
        setRevision(r => r + 1);
    }, []);

    const getUniqueMint = useCallback((): MintInfo | undefined => {
        const entries = [...mintsRef.current.entries()];
        if (entries.length !== 1) return undefined;
        const [mint, decimals] = entries[0];
        return { decimals, mint };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- revision triggers recalculation
    }, [revision]);

    const value = useMemo(() => ({ getUniqueMint, register }), [getUniqueMint, register]);

    return <BatchMintRegistryContext.Provider value={value}>{children}</BatchMintRegistryContext.Provider>;
}

export function useBatchMintRegistry(): BatchMintRegistry | undefined {
    return useContext(BatchMintRegistryContext);
}
