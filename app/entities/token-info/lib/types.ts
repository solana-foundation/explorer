import type { Token as SdkToken } from '@solflare-wallet/utl-sdk';

/**
 * Token information interface.
 * Extends the Solflare UTL SDK Token type to ensure compatibility.
 */
export interface TokenInfo extends SdkToken {}

export type FetchConfig = {
    signal?: AbortSignal;
    next?: NextFetchRequestConfig;
    onError?: (error: unknown) => void;
};
