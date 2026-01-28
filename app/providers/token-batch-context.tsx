'use client';

import { PublicKey } from '@solana/web3.js';
import { Token } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getTokenInfosWithoutOnChainFallback } from '@/app/utils/token-info';

type TokenBatchContextType = {
    getTokenInfo: (address: string) => Token | undefined;
};

const TokenBatchContext = createContext<TokenBatchContextType | undefined>(undefined);

export function TokenBatchProvider({
    children,
    cluster,
    addresses,
}: {
    children: React.ReactNode;
    cluster: Cluster;
    addresses: string[];
}) {
    const [tokenMap, setTokenMap] = useState<Map<string, Token>>(new Map());
    
    const addressesKey = useMemo(() => addresses.join(','), [addresses]);

    useEffect(() => {
        if (addresses.length === 0) return;

        const fetchTokens = async () => {
            const publicKeys = addresses.map(addr => new PublicKey(addr));
            const results = await getTokenInfosWithoutOnChainFallback(publicKeys, cluster);
            setTokenMap(results);
        };

        fetchTokens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressesKey, cluster]);

    const getTokenInfo = (address: string) => tokenMap.get(address);

    return <TokenBatchContext.Provider value={{ getTokenInfo }}>{children}</TokenBatchContext.Provider>;
}

export function useTokenBatch() {
    const context = useContext(TokenBatchContext);

    if (!context) {
        throw new Error('useTokenBatch must be used within TokenBatchProvider');
    }

    return context;
}
