'use client';

import { useRef } from 'react';

import { cn } from '@/app/components/shared/utils';
import { useTablistKeyboard } from '@/app/shared/lib/use-tablist-keyboard';
import { useScrollSpy } from '@/app/shared/ui/navigation-tabs/model/useScrollSpy';

import { GUTTER, MONO_LABEL, SECTIONS } from '../lib/mcp-docs-layout';

const SECTION_PATHS = SECTIONS.map(section => section.id);

export function SectionTabs() {
    const barRef = useRef<HTMLDivElement>(null);
    const { active, scrollToSection, stuck } = useScrollSpy({
        enabled: true,
        paths: SECTION_PATHS,
        registerStickyHeight: false,
        wrapperRef: barRef,
    });

    const { onKeyDown, tabRefs } = useTablistKeyboard<HTMLAnchorElement>(
        SECTIONS.length,
        SECTIONS.findIndex(section => section.id === active),
        index => scrollToSection(SECTIONS[index].id),
    );

    return (
        <div
            ref={barRef}
            className={cn(
                'sticky top-0 z-10 w-full border-0 border-y border-solid border-dark-border transition-colors',

                stuck ? 'bg-heavy-metal-950' : 'bg-transparent',
                GUTTER,
            )}
        >
            <div className="flex lg:items-center lg:gap-14">
                <span className={cn(MONO_LABEL, 'hidden text-heavy-metal-300 lg:block lg:w-[20vw] lg:shrink-0')}>
                    Sections
                </span>
                <div
                    role="tablist"
                    onKeyDown={onKeyDown}
                    className="flex min-w-0 flex-1 gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {SECTIONS.map((section, index) => {
                        const isActive = active === section.id;
                        return (
                            <a
                                key={section.id}
                                ref={node => {
                                    tabRefs.current[index] = node;
                                }}
                                href={`#${section.id}`}
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={isActive ? 0 : -1}
                                onClick={event => {
                                    event.preventDefault();
                                    scrollToSection(section.id);
                                }}
                                className={cn(
                                    'shrink-0 whitespace-nowrap border-0 border-b border-solid bg-transparent px-0 py-4 text-sm no-underline transition-colors',
                                    isActive
                                        ? 'border-dark-accent text-dark-foreground'
                                        : 'border-transparent text-heavy-metal-300 hover:text-dark-foreground',
                                )}
                            >
                                {section.kicker}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
