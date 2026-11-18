import { ERiskLevel } from '../model/use-rugcheck';

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
