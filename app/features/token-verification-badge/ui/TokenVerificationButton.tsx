import { cva } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { EVerificationSource, VerificationSource } from '../lib/types';
import { ERiskLevel, getRiskLevel } from '../model/use-rugcheck';
import { SourceIcon } from './icons/SourceIcon';
import { VerificationIcon } from './VerificationIcon';

const sourceBorderVariants = cva('flex rounded border border-solid p-px opacity-80', {
    variants: {
        tone: {
            [ERiskLevel.Danger]: 'border-red-400',
            [ERiskLevel.Good]: 'border-green-400',
            [ERiskLevel.Warning]: 'border-orange-400',
        },
    },
});

const buttonVariants = cva(
    [
        'flex w-full shrink-0 items-center rounded border border-solid bg-[#1C2120] p-2',
        'md:h-[stretch] md:max-h-fit md:min-h-[69px] md:w-[160px] md:flex-col md:items-start md:px-3 md:py-2',
    ],
    {
        defaultVariants: {
            isLoading: false,
            isOpen: false,
        },
        variants: {
            isLoading: {
                false: 'cursor-pointer',
                true: 'cursor-not-allowed',
            },
            isOpen: {
                false: 'border-black',
                true: 'border-green-400',
            },
        },
    },
);

function getSourceBorderTone(source: VerificationSource): ERiskLevel {
    if (source && source.name === EVerificationSource.RugCheck && source.score !== undefined) {
        return getRiskLevel(source.score);
    }

    return source.verified ? ERiskLevel.Good : ERiskLevel.Danger;
}

type TokenVerificationButtonProps = {
    isLoading?: boolean;
    isOpen: boolean;
    verificationFoundSources: VerificationSource[];
} & React.ComponentPropsWithoutRef<'button'>;

export const TokenVerificationButton = React.forwardRef<HTMLButtonElement, TokenVerificationButtonProps>(
    ({ isLoading, isOpen, verificationFoundSources, className, ...props }, ref) => {
        const hasVerification = verificationFoundSources.length > 0;

        return (
            <button ref={ref} type="button" className={cn(buttonVariants({ isLoading, isOpen }), className)} {...props}>
                <div className="flex w-full items-center gap-2 md:mb-2">
                    <p className="m-0 text-sm text-white">Verification</p>

                    <VerificationIcon verificationFoundSources={verificationFoundSources} isLoading={isLoading} />
                </div>

                {isLoading ? (
                    <span className="spinner-grow spinner-grow-sm text-white md:mb-1" />
                ) : (
                    <div className="flex flex-shrink-0 items-center gap-1">
                        {hasVerification ? (
                            verificationFoundSources.map((source, idx) => (
                                <div key={idx} className={sourceBorderVariants({ tone: getSourceBorderTone(source) })}>
                                    <SourceIcon source={source.name} />
                                </div>
                            ))
                        ) : (
                            <span className="font-semibold text-heavy-metal-400 md:text-base">Not verified</span>
                        )}
                    </div>
                )}
            </button>
        );
    },
);

TokenVerificationButton.displayName = 'TokenVerificationButton';
