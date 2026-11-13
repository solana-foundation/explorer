'use client';

import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cva } from 'class-variance-authority';
import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';

import { ExternalLink } from '@/app/components/shared/ui/external-link';

import { ResourcePreview } from './DeveloperResourcePreviews';

type Resource = {
    title: string;
    description: string;
    link: string;
    preview?: ReactNode;
};

const DEVELOPERS_URL = 'https://solana.com/developers';

const DEFAULT_RESOURCES: Resource[] = [
    {
        description: 'How transactions are built and signed, and when they expire',
        link: 'https://solana.com/docs/core/transactions',
        preview: <ResourcePreview name="transactions" />,
        title: 'Transactions',
    },
    {
        description: 'Accounts, programs, instructions, fees and program-derived addresses',
        link: 'https://solana.com/docs/core',
        preview: <ResourcePreview name="coreConcepts" />,
        title: 'Core Concepts',
    },
    {
        description: 'API references, SDKs, the CLI, cookbook recipes and courses',
        link: 'https://solana.com/docs/tools',
        preview: <ResourcePreview name="developerTools" />,
        title: 'Developer Resources',
    },
    {
        description: 'Build your first program in Solana Playground, nothing to install',
        link: 'https://solana.com/docs/intro/quick-start',
        preview: <ResourcePreview name="quickStart" />,
        title: 'Quick Start',
    },
    {
        description: 'Job openings across the Solana network',
        link: 'https://jobs.solana.com/jobs',
        preview: <ResourcePreview name="jobs" />,
        title: 'Solana Jobs',
    },
];

export function DeveloperResources({ resources = DEFAULT_RESOURCES }: { resources?: Resource[] }) {
    return (
        <CollapsibleSection
            title="Kickstart your development journey on Solana"
            actions={
                <span className="text-sm text-outer-space-300">
                    Find more on <ExternalLink href={DEVELOPERS_URL}>solana.com/developers</ExternalLink>
                </span>
            }
            actionsLayout="wrap"
            collapsible={false}
            fill
            // The cards carry their own borders, as an NFT collection's do, so the section drops its card; below `lg`
            // their row scrolls on into the page gutter, past the section's sides.
            className=""
            bleed
        >
            <ResourceCardRow resources={resources} />
        </CollapsibleSection>
    );
}

/**
 * Bordered cards in one row. On desktop (`lg` up) the row is cut at the column's edge, where a line marks a side with
 * more cards, and arrow buttons under the row scroll it. Below `lg` there are no lines or arrows: the row is swiped, it
 * runs on into the page gutter, so the next card peeks out at the screen's edge, and dots under it light the cards on
 * screen.
 */
function ResourceCardRow({ resources }: { resources: Resource[] }) {
    const [scrollerRef, visible] = useVisibleItems<HTMLDivElement>(resources.length);
    const { canScrollStart, canScrollEnd, onScroll } = useScrollEdges(scrollerRef);

    // Every step puts a card's start `STEP_INSET` past the row's left edge, clear of the edge line. Forward: the first
    // card cut at the right edge. Back: the first card of the screenful before the current one. Only the row's very
    // end, where the browser stops the scroll short, can leave the left edge off a card start.
    const scrollBy = (direction: -1 | 1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const cards = Array.from(scroller.children) as HTMLElement[];
        const viewStart = scroller.scrollLeft;
        const viewEnd = viewStart + scroller.clientWidth;
        const target =
            direction === 1
                ? cards.find(card => card.offsetLeft + card.offsetWidth > viewEnd + 1)
                : cards.find(
                      card =>
                          card.offsetLeft >= viewStart + STEP_INSET - scroller.clientWidth &&
                          card.offsetLeft < viewStart + STEP_INSET - 1,
                  );
        const left = target ? target.offsetLeft - STEP_INSET : direction === 1 ? scroller.scrollWidth : 0;
        scroller.scrollTo({ behavior: 'smooth', left });
    };

    const scrollable = canScrollStart || canScrollEnd;

    return (
        <>
            {/* `lg:py-2`: room for the edge lines to reach past the cards. `lg:-mt-2` takes the top half back out
                of the section's title gap, so the cards sit as far under the title as any other section's card. */}
            <div className="relative lg:-mt-2 lg:py-2">
                {/* `relative`: the cards' `offsetLeft` is then measured from the row's own start. The negative margin and
                the padding match `PageContainer`'s gutter at each width below `lg`. */}
                <div
                    ref={scrollerRef}
                    onScroll={onScroll}
                    className="relative -mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {resources.map(resource => (
                        <BorderedResourceCard key={resource.link} {...resource} />
                    ))}
                </div>
                {canScrollStart && <span aria-hidden className={edgeLineVariants({ side: 'start' })} />}
                {canScrollEnd && <span aria-hidden className={edgeLineVariants({ side: 'end' })} />}
            </div>
            {scrollable && (
                // In place of the arrows below `lg`: one dot per card, lit while it is on screen.
                <div aria-hidden className="flex gap-1.5 pb-3 pt-4 lg:hidden">
                    {resources.map((resource, index) => (
                        <span key={resource.link} className={dotVariants({ visible: visible[index] ?? false })} />
                    ))}
                </div>
            )}
            {scrollable && (
                // Under the row rather than over the cards' edges, so they are easy to hit and do not read as part of
                // a card. Both stay in place; the one with nowhere to go is disabled rather than removed.
                <div className="hidden gap-2 pt-2 lg:flex">
                    <ScrollArrow label="Scroll back" disabled={!canScrollStart} onClick={() => scrollBy(-1)}>
                        <ChevronLeft size={16} />
                    </ScrollArrow>
                    <ScrollArrow label="Scroll forward" disabled={!canScrollEnd} onClick={() => scrollBy(1)}>
                        <ChevronRight size={16} />
                    </ScrollArrow>
                </div>
            )}
        </>
    );
}

// Room between the edge line and the card a scroll step lands on. The row's start keeps no such gap: with nothing
// before it there is no line there, and the first card stays on the title's vertical.
const STEP_INSET = 8;

// The cut edge, desktop only: a line spanning the wrapper's `py-2`, so it shows 8px over and under the cards and reads
// as the row's edge rather than a card border.
const edgeLineVariants = cva('pointer-events-none absolute inset-y-0 hidden w-px bg-outer-space-700 lg:block', {
    variants: { side: { end: 'right-0', start: 'left-0' } },
});

/** A card like an NFT collection's: art, then the title, a link that covers the whole card, and the description. */
function BorderedResourceCard({ title, description, link, preview }: Resource) {
    return (
        <div className="relative flex w-[280px] shrink-0 flex-col gap-2 rounded-lg border border-solid border-outer-space-800 bg-outer-space-900 px-2.5 pb-2.5 pt-2.5 transition-colors hover:border-outer-space-600">
            <div className="aspect-[25/12] w-full overflow-hidden rounded-sm">{preview}</div>
            <div className="flex flex-col gap-1 text-sm">
                <ExternalLink href={link} className="after:absolute after:inset-0 after:rounded-lg after:content-['']">
                    {title}
                </ExternalLink>
                <p className="m-0 line-clamp-2 text-outer-space-300">{description}</p>
            </div>
        </div>
    );
}

/** A round button styled like the cards (their surface and border), so it sits with them without reading as one. */
function ScrollArrow({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-solid border-outer-space-700 bg-outer-space-900 p-0 text-white transition-colors hover:border-outer-space-500 disabled:cursor-default disabled:text-outer-space-600 disabled:hover:border-outer-space-700"
        >
            {children}
        </button>
    );
}

const dotVariants = cva('size-1.5 rounded-full transition-colors', {
    defaultVariants: { visible: false },
    variants: { visible: { false: 'bg-outer-space-700', true: 'bg-white' } },
});

// A card counts as on screen once half of it is: a sliver at the edge reads as "more this way", not as seen.
const VISIBLE_RATIO = 0.5;

/** Which direct children of the returned ref's element are on screen inside it, in order. All, until measured. */
function useVisibleItems<T extends HTMLElement>(count: number): [RefObject<T | null>, boolean[]] {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState<boolean[]>(() => Array<boolean>(count).fill(true));

    useEffect(() => {
        const root = ref.current;
        if (!root || typeof IntersectionObserver === 'undefined') return;

        const items = Array.from(root.children);
        const observer = new IntersectionObserver(
            entries => {
                setVisible(previous => {
                    const next = items.map((_item, index) => previous[index] ?? true);
                    for (const entry of entries) {
                        const index = items.indexOf(entry.target);
                        if (index >= 0) next[index] = entry.intersectionRatio >= VISIBLE_RATIO;
                    }
                    return next;
                });
            },
            { root, threshold: VISIBLE_RATIO },
        );
        items.forEach(item => observer.observe(item));
        return () => observer.disconnect();
    }, [count]);

    return [ref, visible];
}

/** Whether a sideways scroller has more to show on either side; rechecked on scroll and when it resizes. */
function useScrollEdges(ref: RefObject<HTMLDivElement | null>) {
    const [edges, setEdges] = useState({ canScrollEnd: false, canScrollStart: false });

    const onScroll = useCallback(() => {
        const element = ref.current;
        if (!element) return;
        // A pixel of slack: zoomed layouts leave fractional scroll positions that never quite reach the end.
        const canScrollStart = element.scrollLeft > 1;
        const canScrollEnd = element.scrollWidth - element.scrollLeft - element.clientWidth > 1;
        setEdges(previous =>
            previous.canScrollStart === canScrollStart && previous.canScrollEnd === canScrollEnd
                ? previous
                : { canScrollEnd, canScrollStart },
        );
    }, [ref]);

    useEffect(() => {
        const element = ref.current;
        onScroll();
        if (!element || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(onScroll);
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, onScroll]);

    return { ...edges, onScroll };
}
