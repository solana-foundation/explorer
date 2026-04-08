import { ERiskLevel } from '../model/use-rugcheck';

/**
 * Deliberately slim: verification checks must work even when token metadata
 * is unavailable (e.g. the token isn't in the UTL registry). Using the full
 * FullTokenInfo here would make the entire badge no-op whenever the metadata
 * lookup fails, hiding valid Jupiter/Bluprynt/RugCheck results.
 */
export type VerificationTarget = {
    address: string;
    solflareVerified?: boolean;
};

export enum EVerificationSource {
    Bluprynt = 'Bluprynt',
    CoinGecko = 'CoinGecko',
    Solflare = 'Solflare',
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
