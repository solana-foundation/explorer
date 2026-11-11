import { ERiskLevel } from '../model/use-rugcheck';

/**
 * Deliberately slim: verification checks must work even when token metadata
 * is unavailable. Using the full FullTokenInfo here would make the entire badge
 * no-op whenever the metadata lookup fails, hiding valid Jupiter/RugCheck results.
 */
export type VerificationTarget = {
    address: string;
    isTokenMint?: boolean;
};

export enum EVerificationSource {
    CoinGecko = 'CoinGecko',
    Jupiter = 'Jupiter',
    RugCheck = 'RugCheck',
}

export type VerificationSource = {
    applyUrl?: string;
    isRateLimited?: boolean;
    isVerificationFound?: boolean;
    level?: ERiskLevel;
    name: EVerificationSource;
    score?: number;
    url?: string;
    verified: boolean;
};
