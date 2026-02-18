import { VerificationSource } from '../lib/types';
import { VerificationIcon } from './VerificationIcon';

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
            className={`e-flex e-w-full md:e-w-[160px] e-flex-col e-justify-between e-rounded e-border e-border-solid e-bg-[#1C2120] e-px-3 e-py-2 md:e-h-[stretch] md:e-min-h-[69px] ${
                isOpen ? 'e-border-green-400' : 'e-border-black'
            } ${isLoading ? 'e-cursor-not-allowed' : 'e-cursor-pointer'}`}
        >
            <div className="e-flex e-w-full e-items-center e-gap-2 mb-2">
                <p className="e-m-0 e-text-sm e-text-white">Verification</p>

                <VerificationIcon
                    verifiedSources={verifiedSources}
                    verificationFoundSources={verificationFoundSources}
                    isLoading={isLoading}
                />
            </div>

            {isLoading ? (
                <span className="e-spinner-grow e-spinner-grow-sm e-mb-1 e-text-white" />
            ) : (
                <div className="e-flex e-items-center e-gap-1">
                    {hasVerification ? (
                        verificationFoundSources.map((source, idx) => (
                            <div
                                key={idx}
                                className={`e-flex e-rounded e-border e-border-solid e-p-px e-opacity-80 ${
                                    source.verified ? 'e-border-green-400' : 'e-border-red-400'
                                }`}
                            >
                                {source.icon}
                            </div>
                        ))
                    ) : (
                        <span className="e-text-base e-font-semibold e-text-heavy-metal-400">Not verified</span>
                    )}
                </div>
            )}
        </button>
    );
}
