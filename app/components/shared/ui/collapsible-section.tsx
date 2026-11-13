// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { Button } from '@components/shared/ui/button';
import { cn, cnPrefixed } from '@components/shared/utils';
import { cva } from 'class-variance-authority';
import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { baseCardVariants } from '@/app/shared/ui/Card';

// `fill` is for a section that sits in a grid or a gap-spaced stack: it stretches to its cell's height, and
// its card drops the dashkit bottom margin, so the container's gap is the only spacing between sections.
const sectionVariants = cva('flex flex-col gap-3', {
    defaultVariants: { fill: false },
    variants: { fill: { false: '', true: 'h-full' } },
});

// How the actions sit against the title. `inline` keeps them at the row's end, centred (buttons). `wrap` drops a text
// link under the title when the row cannot hold both, so a long title keeps its width; on one line the link shares
// the title's baseline. `top` keeps a compact control (an icon button) at the end, level with the title's first line
// while the title wraps below `sm`, and from `sm`, where the link is text again, on the title's baseline.
const titleRowVariants = cva('flex justify-between', {
    defaultVariants: { actions: 'inline' },
    variants: {
        actions: {
            inline: 'items-center',
            top: 'items-start gap-3 sm:items-baseline',
            wrap: 'flex-wrap items-baseline gap-x-4 gap-y-1',
        },
    },
});

const bodyVariants = cva('grid transition-[grid-template-rows] duration-200 ease-in-out', {
    defaultVariants: { fill: false },
    variants: {
        fill: { false: '', true: 'flex-1' },
        open: { false: 'grid-rows-[0fr]', true: 'grid-rows-[1fr]' },
    },
});

// The clip hides the body while it collapses. `bleed` lifts it, so content can reach past the section's sides (a row
// that scrolls into the page gutter); only for a section that does not collapse. `min-w-0` takes over the clip's other
// job: as a grid item the body would otherwise widen to its content's width.
const bodyClipVariants = cva('', {
    defaultVariants: { bleed: false, fill: false },
    variants: {
        bleed: { false: 'overflow-hidden', true: 'min-w-0' },
        fill: { false: '', true: 'flex flex-col' },
    },
});

type CollapsibleSectionProps = {
    id?: string;
    title: ReactNode;
    actions?: ReactNode;
    /** Full-width content stacked under the title row, inside the same (always-visible) title group. */
    belowTitle?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    /** When false, the collapse toggle is hidden and the body is always shown. Defaults to true. */
    collapsible?: boolean;
    /** How the actions sit against the title; see `titleRowVariants`. Defaults to `inline`. */
    actionsLayout?: 'inline' | 'top' | 'wrap';
    /** Stretch to the grid cell's height and leave the spacing to the container's gap. Defaults to false. */
    fill?: boolean;
    /** Let the body's content show past the section's sides. Only with `collapsible={false}`. Defaults to false. */
    bleed?: boolean;
    className?: string;
    titleClassName?: string;
    sectionClassName?: string;
};

export function CollapsibleSection({
    id,
    title,
    actions,
    belowTitle,
    children,
    defaultExpanded = true,
    collapsible = true,
    actionsLayout = 'inline',
    fill = false,
    bleed = false,
    className = fill
        ? baseCardVariants({ flex: 'grow', marginBottom: 'none', ui: 'dashkit' })
        : baseCardVariants({ ui: 'dashkit' }),
    titleClassName,
    sectionClassName,
}: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const headingId = useId();

    // When not collapsible, the body is always shown regardless of the (unused) toggle state.
    const isOpen = !collapsible || expanded;

    return (
        <section id={id} aria-labelledby={headingId} className={cn(sectionVariants({ fill }), sectionClassName)}>
            {/* Title (plus optional `belowTitle`) forms the first column; actions and the collapse toggle
                form a second. Without `belowTitle` the title stays a direct child, untouched. */}
            <div
                data-section-title
                className={cnPrefixed(titleRowVariants({ actions: actionsLayout }), titleClassName)}
            >
                {belowTitle ? (
                    <div className="flex min-w-0 flex-col gap-2">
                        <h2 id={headingId} className="m-0 text-lg font-normal text-white">
                            {title}
                        </h2>
                        {belowTitle}
                    </div>
                ) : (
                    <h2 id={headingId} className="m-0 text-lg font-normal text-white">
                        {title}
                    </h2>
                )}
                {(collapsible || actions) && (
                    <div className="flex shrink-0 items-center gap-1">
                        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
                        {collapsible && (
                            <Button
                                className="md:min-w-[86px]"
                                variant="outline"
                                aria-expanded={expanded}
                                size="sm"
                                aria-label={expanded ? 'Collapse' : 'Expand'}
                                onClick={() => setExpanded(v => !v)}
                            >
                                <ChevronDown
                                    size={12}
                                    className={cn(
                                        'transition-transform duration-200 ease-in-out',
                                        // Rotate via an explicit `transform` rather than the `rotate-*` utility so an
                                        // ancestor's `translate` transform can't override the flip.
                                        expanded && '[transform:rotate(180deg)]',
                                    )}
                                />
                                <span className="hidden md:inline-block">{expanded ? 'Collapse' : 'Expand'}</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <div className={bodyVariants({ fill, open: isOpen })}>
                <div className={bodyClipVariants({ bleed, fill })}>
                    <div className={className}>{children}</div>
                </div>
            </div>
        </section>
    );
}
