import { RISK_MAX_LEVEL_GOOD, RISK_MAX_LEVEL_WARNING } from '@/app/utils/rugcheck';

import { VerificationSource } from '../lib/types';
import { EVerificationSource } from '../model/use-verification-sources';
import { VerificationIcon } from './VerificationIcon';

function getSourceBorderColor(source: VerificationSource): string {
    if (source && source.name === EVerificationSource.RugCheck && source.score !== undefined) {
        if (source.score <= RISK_MAX_LEVEL_GOOD) return 'e-border-green-400';
        if (source.score <= RISK_MAX_LEVEL_WARNING) return 'e-border-orange-400';
        return 'e-border-red-400';
    }

    return source.verified ? 'e-border-green-400' : 'e-border-red-400';
}

export function TokenVerificationButton({
    isLoading,
    isOpen,
    setIsOpen,
    verifiedSources,
    verificationFoundSources,
}: {
    isLoading?: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    verifiedSources: VerificationSource[];
    verificationFoundSources: VerificationSource[];
}) {
    const hasVerification = verifiedSources.length > 0;

    return (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`e-flex e-w-full e-items-center e-rounded e-border e-border-solid e-bg-[#1C2120] e-p-2 md:e-h-[stretch] md:e-min-h-[69px] md:e-w-[160px] md:e-flex-col md:e-items-start md:e-px-3 md:e-py-2 ${
                isOpen ? 'e-border-green-400' : 'e-border-black'
            } ${isLoading ? 'e-cursor-not-allowed' : 'e-cursor-pointer'}`}
        >
            <div className="e-flex e-w-full e-items-center e-gap-2 md:e-mb-2">
                <p className="e-m-0 e-text-sm e-text-white">Verification</p>

                <VerificationIcon
                    verifiedSources={verifiedSources}
                    verificationFoundSources={verificationFoundSources}
                    isLoading={isLoading}
                />
            </div>

            {isLoading ? (
                <span className="e-spinner-grow e-spinner-grow-sm e-text-white md:e-mb-1" />
            ) : (
                <div className="e-flex e-flex-shrink-0 e-items-center e-gap-1">
                    {hasVerification ? (
                        verificationFoundSources.map((source, idx) => (
                            <div
                                key={idx}
                                className={`e-flex e-rounded e-border e-border-solid e-p-px e-opacity-80 ${getSourceBorderColor(
                                    source
                                )}`}
                            >
                                {source.icon}
                            </div>
                        ))
                    ) : (
                        <span className="e-font-semibold e-text-heavy-metal-400 md:e-text-base">Not verified</span>
                    )}
                </div>
            )}
        </button>
    );
}
