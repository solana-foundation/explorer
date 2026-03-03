import { ERiskLevel } from '../model/use-rugcheck';

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
