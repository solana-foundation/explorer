import {
    getPerpMarketFromPerpMarketConfig,
    getSpotMarketFromSpotMarketConfig,
    Market,
    PerpMarket,
    PerpMarketConfig,
    SpotMarketConfig,
} from '@explorer/decoder-mango';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

export function useMangoPerpMarket(config: PerpMarketConfig | undefined): PerpMarket | undefined {
    const { url } = useCluster();
    const [market, setMarket] = useState<PerpMarket | undefined>(undefined);

    useAsyncEffect(
        async isMounted => {
            if (config === undefined) {
                if (isMounted()) setMarket(undefined);
                return;
            }
            try {
                const resolved = await getPerpMarketFromPerpMarketConfig(url, config);
                if (isMounted()) setMarket(resolved);
            } catch {
                if (isMounted()) setMarket(undefined);
            }
        },
        [url, config],
    );

    return market;
}

export function useMangoSpotMarket(programId: PublicKey, config: SpotMarketConfig | undefined): Market | undefined {
    const { url } = useCluster();
    const [market, setMarket] = useState<Market | undefined>(undefined);

    useAsyncEffect(
        async isMounted => {
            if (config === undefined) {
                if (isMounted()) setMarket(undefined);
                return;
            }
            try {
                const resolved = await getSpotMarketFromSpotMarketConfig(programId, url, config);
                if (isMounted()) setMarket(resolved ?? undefined);
            } catch {
                if (isMounted()) setMarket(undefined);
            }
        },
        [url, programId, config],
    );

    return market;
}
