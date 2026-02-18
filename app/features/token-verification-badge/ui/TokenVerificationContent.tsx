import { Check } from 'react-feather';

import { VerificationSource } from '../lib/types';
import { ERiskLevel } from '@/app/utils/rugcheck';
import { EVerificationSource } from '../model/use-verification-sources';

function getLevelColor(level?: ERiskLevel): string {
    switch (level) {
        case ERiskLevel.Good:
            return 'e-text-green-400';
        case ERiskLevel.Warning:
            return 'e-text-orange-400';
        case ERiskLevel.Danger:
            return 'e-text-red-400';
        default:
            return 'e-text-gray-400';
    }
}

function VerificationBadge({ source }: { source: VerificationSource }) {
    if (source.name === EVerificationSource.RugCheck && source.score !== undefined) {
        return (
            <div className="e-flex e-items-center e-gap-1 e-rounded-md e-border e-border-solid e-border-heavy-metal-600 e-bg-heavy-metal-800 e-p-1">
                {source.icon}
                <span className="e-text-xs e-text-gray-200">
                    {source.name} risk: {source.score}/100 -{' '}
                    <span className={getLevelColor(source.level as ERiskLevel)}>{source.level}</span>
                </span>
            </div>
        );
    }

    if (source.verified) {
        return (
            <div className="e-flex e-items-center e-gap-1 e-rounded-md e-border e-border-solid e-border-heavy-metal-600 e-bg-heavy-metal-800 e-p-1">
                {source.icon}
                <span className="e-text-xs e-text-gray-200">{source.name}</span>
                <Check className="e-text-green-400" size={16} />
            </div>
        );
    }

    return null;
}

function ApplyForVerificationLink({ source }: { source: VerificationSource }) {
    const sourceName = source.name === EVerificationSource.RugCheck ? `${EVerificationSource.RugCheck} risk: Unknown` : source.name;

    return (
        <a
            href={source.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="e-text-xs e-text-white e-underline hover:e-text-gray-400"
        >
            {sourceName}
        </a>
    );
}

export function TokenVerificationContent({
    verifiedSources,
    unverifiedSources,
    verificationFoundSources,
    alignRight,
}: {
    verifiedSources: VerificationSource[];
    unverifiedSources: VerificationSource[];
    verificationFoundSources: VerificationSource[];
    alignRight: boolean;
}) {
    const hasVerification = verifiedSources.length > 0;

    return (
        <div
            className={`e-absolute e-top-full e-z-50 e-mt-1 e-min-w-[300px] e-rounded-xl e-border e-border-solid e-border-outer-space-800 e-bg-outer-space-900 e-p-4 ${
                alignRight ? 'e-right-0' : 'e-left-0'
            }`}
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
        >
            <p className="e-mb-1 e-text-base e-font-semibold e-text-gray-200">
                {hasVerification ? (
                    <>
                        This token is verified
                        <br />
                        by independent validators
                    </>
                ) : (
                    <>
                        This token is not verified
                        <br />
                        by independent validators
                    </>
                )}
            </p>
            {hasVerification ? (
                <div className="e-flex e-flex-wrap e-gap-2">
                    {verificationFoundSources.map((source, idx) => (
                        <VerificationBadge key={idx} source={source} />
                    ))}
                </div>
            ) : (
                <span className="e-mb-2 e-text-xs e-text-heavy-metal-400">
                    This doesn&apos;t mean it&apos;s scam, just make double check if it&apos;s what you need.
                </span>
            )}

            {unverifiedSources.length > 0 && (
                <div className="e-mt-4">
                    <p className="e-mb-1 e-text-[10px] e-uppercase e-tracking-wider e-text-heavy-metal-400">
                        Apply for {hasVerification ? 'extra ' : ''}verification
                    </p>
                    <div className="e-flex e-flex-wrap e-gap-x-3 e-gap-y-1">
                        {unverifiedSources.map((source, idx) => (
                            <ApplyForVerificationLink key={idx} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
