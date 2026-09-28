import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { BAND_RULE, GUTTER, MONO_LABEL, SECTIONS } from '../lib/mcp-docs-layout';

export function NumberedBand({
    children,
    flushTop,
    section,
}: {
    children: React.ReactNode;

    flushTop?: boolean;
    section: (typeof SECTIONS)[number];
}) {
    const { Icon } = section;
    return (
        <div
            id={section.id}
            className={cn(
                'flex w-full scroll-mt-16 flex-col gap-5 pb-11 pt-8 sm:gap-6 sm:pb-20 sm:pt-11 lg:flex-row lg:gap-14',
                GUTTER,
                !flushTop && BAND_RULE,
            )}
        >
            <div className="flex w-full flex-row items-center gap-3 sm:gap-3.5 lg:w-[20vw] lg:flex-col lg:items-start lg:gap-1.5">
                <Icon
                    aria-hidden
                    strokeWidth={1.5}
                    className="size-[35px] shrink-0 text-dark-accent sm:size-10 lg:size-[33px] xxl:size-10"
                />
                <span className={cn(MONO_LABEL, 'text-heavy-metal-300')}>{section.kicker}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-6 lg:max-w-4xl lg:flex-1">{children}</div>
        </div>
    );
}

export function BandIntro({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <div className="flex w-full flex-col gap-3">
            <h2 className="text-5 sm:text-6 m-0 font-normal leading-6 tracking-tight text-dark-foreground sm:leading-7 sm:tracking-tight lg:text-3xl lg:leading-8 lg:tracking-tight xxl:text-4xl xxl:leading-9 xxl:tracking-tight">
                {title}
            </h2>
            <p className="m-0 max-w-3xl text-sm leading-5 text-heavy-metal-300 sm:text-base sm:leading-6">{children}</p>
        </div>
    );
}
