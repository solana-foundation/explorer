'use client';

import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MintInfo } from '../lib/types';

type BatchMintRegistry = {
    register: (mint: string, decimals: number) => void;
    getUniqueMint: () => MintInfo | undefined;
};

const BatchMintRegistryContext = createContext<BatchMintRegistry | undefined>(undefined);

export function BatchMintRegistryProvider({ children }: { children: ReactNode }) {
    const [mints, setMints] = useState<Map<string, number>>(new Map());

    const register = useCallback((mint: string, decimals: number) => {
        setMints(prev => {
            if (prev.get(mint) === decimals) return prev;
            const next = new Map(prev);
            next.set(mint, decimals);
            return next;
        });
    }, []);

    const getUniqueMint = useCallback((): MintInfo | undefined => {
        if (mints.size !== 1) return undefined;
        const [mint, decimals] = [...mints.entries()][0];
        return { decimals, mint };
    }, [mints]);

    const value = useMemo(() => ({ getUniqueMint, register }), [getUniqueMint, register]);

    return <BatchMintRegistryContext.Provider value={value}>{children}</BatchMintRegistryContext.Provider>;
}

export function useBatchMintRegistry(): BatchMintRegistry | undefined {
    return useContext(BatchMintRegistryContext);
}
