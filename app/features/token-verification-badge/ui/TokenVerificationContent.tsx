import { cva } from 'class-variance-authority';
import { AlertCircle, Check, X } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

import { EVerificationSource, VerificationSource } from '../lib/types';
import { ERiskLevel } from '../model/use-rugcheck';
import { SourceIcon } from './icons/SourceIcon';

const riskLevelVariants = cva('', {
    variants: {
        level: {
            [ERiskLevel.Danger]: 'text-red-400',
            [ERiskLevel.Good]: 'text-green-400',
            [ERiskLevel.Warning]: 'text-orange-400',
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
                className="flex items-center gap-1 rounded-md border border-solid border-heavy-metal-600 bg-heavy-metal-800 p-1 hover:border-heavy-metal-500 hover:bg-heavy-metal-700"
            >
                <SourceIcon source={source.name} />
                <span className="text-xs text-gray-200">
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
            className="flex items-center gap-1 rounded-md border border-solid border-heavy-metal-600 bg-heavy-metal-800 p-1 hover:border-heavy-metal-500 hover:bg-heavy-metal-700"
        >
            <SourceIcon source={source.name} />
            <span className="text-xs text-gray-200">{source.name}</span>
            {source.verified ? (
                <Check className="text-green-400" size={16} />
            ) : (
                <X className="text-red-400" size={16} />
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
            className="text-xs text-white underline hover:text-gray-400"
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
            className="flex items-center gap-1 rounded-md border border-solid border-orange-600/50 bg-orange-900/20 p-1 hover:border-orange-500 hover:bg-orange-800/50"
        >
            <SourceIcon source={source.name} />
            <span className="text-xs text-orange-400">{source.name}</span>
            <AlertCircle className="text-orange-400" size={14} />
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
        return <p className="m-0 text-base font-semibold text-gray-200">Checking verifications</p>;
    }

    return (
        <div>
            <p className="mb-1 text-base font-semibold text-gray-200">
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
                <div className="flex flex-wrap gap-2">
                    {verificationFoundSources.map((source, idx) => (
                        <VerificationBadge key={idx} source={source} />
                    ))}
                </div>
            ) : (
                <span className="mb-2 text-xs text-heavy-metal-400">
                    This doesn&apos;t mean it&apos;s a scam, just double-check if it&apos;s what you need.
                </span>
            )}

            {rateLimitedSources.length > 0 && (
                <div className="mt-4">
                    <p className="m-0 text-[10px] uppercase tracking-wider text-orange-400">
                        Rate limited (try again later)
                    </p>
                    <p className="mb-1 text-[10px] text-heavy-metal-400">You can check validators manually</p>
                    <div className="flex flex-wrap gap-2">
                        {rateLimitedSources.map((source, idx) => (
                            <RateLimitedBadge key={idx} source={source} />
                        ))}
                    </div>
                </div>
            )}

            {sourcesToApply.length > 0 && (
                <div className="mt-4">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-heavy-metal-400">
                        Apply for {hasVerification ? 'extra ' : ''}verification
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {sourcesToApply.map((source, idx) => (
                            <ApplyForVerificationLink key={idx} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
