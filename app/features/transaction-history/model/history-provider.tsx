'use client';

import * as Cache from '@providers/cache';
import { ActionType } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import React from 'react';

import { reconcile } from '../lib/reconcile';
import type { AccountHistory, HistoryUpdate } from '../lib/types';

export type State = Cache.State<AccountHistory>;
export type Dispatch = Cache.Dispatch<HistoryUpdate>;

export const StateContext: React.Context<State | undefined> = React.createContext<State | undefined>(undefined);
export const DispatchContext: React.Context<Dispatch | undefined> = React.createContext<Dispatch | undefined>(
    undefined,
);
export const InFlightContext: React.Context<Set<string> | undefined> = React.createContext<Set<string> | undefined>(
    undefined,
);
// Monotonic per-address counter. Bumped whenever a request is superseded (e.g. a
// filter change) so the in-flight response can be discarded instead of overwriting
// the freshly-cleared cache. See `useResetAccountHistory`.
export const GenerationContext: React.Context<Map<string, number> | undefined> = React.createContext<
    Map<string, number> | undefined
>(undefined);

// Whether the current endpoint supports getTransactionsForAddress. Flips to false the
// first time the method is not found, so the UI can disable filtering (the
// getSignaturesForAddress fallback can't honour any of the filters).
export type MethodSupport = { supported: boolean; markUnsupported: () => void };
export const MethodSupportContext: React.Context<MethodSupport | undefined> = React.createContext<
    MethodSupport | undefined
>(undefined);

// Addresses this endpoint's getTransactionsForAddress index does not cover: an earlier page
// came back empty while getSignaturesForAddress still had rows. Latched per address, and
// scoped to the endpoint (cleared with the cluster url) since coverage is a property of the
// endpoint's index, not of the address.
export const SignaturesOnlyContext: React.Context<Set<string> | undefined> = React.createContext<
    Set<string> | undefined
>(undefined);

type HistoryProviderProps = { children: React.ReactNode };
export function HistoryProvider({ children }: HistoryProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useCustomReducer(url, reconcile);
    const inFlightRef = React.useRef(new Set<string>());
    const generationRef = React.useRef(new Map<string, number>());
    const signaturesOnlyRef = React.useRef(new Set<string>());
    const [supported, setSupported] = React.useState(true);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
        inFlightRef.current.clear();
        generationRef.current.clear();
        signaturesOnlyRef.current.clear();
        setSupported(true);
    }, [dispatch, url]);

    const markUnsupported = React.useCallback(() => setSupported(false), []);
    const methodSupport = React.useMemo(() => ({ markUnsupported, supported }), [markUnsupported, supported]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <InFlightContext.Provider value={inFlightRef.current}>
                    <GenerationContext.Provider value={generationRef.current}>
                        <SignaturesOnlyContext.Provider value={signaturesOnlyRef.current}>
                            <MethodSupportContext.Provider value={methodSupport}>
                                {children}
                            </MethodSupportContext.Provider>
                        </SignaturesOnlyContext.Provider>
                    </GenerationContext.Provider>
                </InFlightContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}
