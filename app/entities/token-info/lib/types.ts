/**
 * Tags the unified token list (UTL) API attaches to a token.
 */
export enum Tag {
    LP_TOKEN = 'lp-token',
}

/**
 * Token information returned by the unified token list (UTL) API and by the
 * on-chain Metaplex fallback.
 *
 * This mirrors the `Token` type that came from `@solflare-wallet/utl-sdk`. The
 * shape is the UTL REST response contract, so do not change it.
 */
export interface TokenInfo {
    name: string;
    symbol: string;
    logoURI: string | null;
    verified?: boolean;
    address: string;
    tags?: Set<Tag>;
    decimals: number | null;
    holders?: number | null;
}

export type FetchConfig = {
    signal?: AbortSignal;
    next?: NextFetchRequestConfig;
    onError?: (error: unknown) => void;
};
