import { cva } from 'class-variance-authority';
import { AlertCircle, Check, X } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

import { EVerificationSource, VerificationSource } from '../lib/types';
import { ERiskLevel } from '../model/use-rugcheck';
import { SourceIcon } from './icons/SourceIcon';

const riskLevelVariants = cva('', {
    variants: {
        level: {
            [ERiskLevel.Danger]: 'e-text-red-400',
            [ERiskLevel.Good]: 'e-text-green-400',
            [ERiskLevel.Warning]: 'e-text-orange-400',
        },
    },
});

function RiskLevelText({ level, children }: { level?: ERiskLevel; children: React.ReactNode }) {
    return <span className={cn(riskLevelVariants({ level }))}>{children}</span>;
}

function VerificationBadge({ source }: { source: VerificationSource }) {
    if (source.name === EVerificationSource.RugCheck && source.score !== undefined) {
        return (
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="e-flex e-items-center e-gap-1 e-rounded-md e-border e-border-solid e-border-heavy-metal-600 e-bg-heavy-metal-800 e-p-1 hover:e-border-heavy-metal-500 hover:e-bg-heavy-metal-700"
            >
                <SourceIcon source={source.name} />
                <span className="e-text-xs e-text-gray-200">
                    {source.name} risk: {source.score}/100 -{' '}
                    <RiskLevelText level={source.level as ERiskLevel}>{source.level}</RiskLevelText>
                </span>
            </a>
        );
    }

    return (
        <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="e-flex e-items-center e-gap-1 e-rounded-md e-border e-border-solid e-border-heavy-metal-600 e-bg-heavy-metal-800 e-p-1 hover:e-border-heavy-metal-500 hover:e-bg-heavy-metal-700"
        >
            <SourceIcon source={source.name} />
            <span className="e-text-xs e-text-gray-200">{source.name}</span>
            {source.verified ? (
                <Check className="e-text-green-400" size={16} />
            ) : (
                <X className="e-text-red-400" size={16} />
            )}
        </a>
    );
}

function ApplyForVerificationLink({ source }: { source: VerificationSource }) {
    const sourceName =
        source.name === EVerificationSource.RugCheck ? `${EVerificationSource.RugCheck} risk: Unknown` : source.name;

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

function RateLimitedBadge({ source }: { source: VerificationSource }) {
    return (
        <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="e-flex e-items-center e-gap-1 e-rounded-md e-border e-border-solid e-border-orange-600/50 e-bg-orange-900/20 e-p-1 hover:e-border-orange-500 hover:e-bg-orange-800/50"
        >
            <SourceIcon source={source.name} />
            <span className="e-text-xs e-text-orange-400">{source.name}</span>
            <AlertCircle className="e-text-orange-400" size={14} />
        </a>
    );
}

export function TokenVerificationContent({
    isLoading,
    rateLimitedSources,
    sourcesToApply,
    verificationFoundSources,
}: {
    isLoading?: boolean;
    rateLimitedSources: VerificationSource[];
    sourcesToApply: VerificationSource[];
    verificationFoundSources: VerificationSource[];
}) {
    const hasVerification = verificationFoundSources.length > 0;

    if (isLoading) {
        return <p className="e-m-0 e-text-base e-font-semibold e-text-gray-200">Checking verifications</p>;
    }

    return (
        <div>
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

            {rateLimitedSources.length > 0 && (
                <div className="e-mt-4">
                    <p className="e-m-0 e-text-[10px] e-uppercase e-tracking-wider e-text-orange-400">
                        Rate limited (try again later)
                    </p>
                    <p className="e-mb-1 e-text-[10px] e-text-heavy-metal-400">You can check validators manually</p>
                    <div className="e-flex e-flex-wrap e-gap-2">
                        {rateLimitedSources.map((source, idx) => (
                            <RateLimitedBadge key={idx} source={source} />
                        ))}
                    </div>
                </div>
            )}

            {sourcesToApply.length > 0 && (
                <div className="e-mt-4">
                    <p className="e-mb-1 e-text-[10px] e-uppercase e-tracking-wider e-text-heavy-metal-400">
                        Apply for {hasVerification ? 'extra ' : ''}verification
                    </p>
                    <div className="e-flex e-flex-wrap e-gap-x-3 e-gap-y-1">
                        {sourcesToApply.map((source, idx) => (
                            <ApplyForVerificationLink key={idx} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
