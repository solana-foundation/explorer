import { DispatchContext, StateContext, type Supply } from '@providers/supply';
import type { ReactNode } from 'react';

const defaultSupply: Supply = {
    circulating: 510_345_678n * 1_000_000_000n,
    nonCirculating: 80_123_456n * 1_000_000_000n,
    total: 590_469_134n * 1_000_000_000n,
};

type Props = {
    children: ReactNode;
    supply?: Supply;
};

/**
 * Mock SupplyProvider for Storybook. Provides a fixed Supply value and a no-op dispatch
 * so consumers of `useSupply` / `useFetchSupply` render without hitting the RPC.
 */
export function MockSupplyProvider({ children, supply = defaultSupply }: Props) {
    return (
        <StateContext.Provider value={supply}>
            <DispatchContext.Provider value={() => {}}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}
