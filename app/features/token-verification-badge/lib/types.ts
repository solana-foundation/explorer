export type VerificationSource = {
    name: string;
    verified: boolean;
    icon: React.ReactNode;
    score?: number;
    level?: string;
    isVerificationFound?: boolean;
    applyUrl?: string;
};
