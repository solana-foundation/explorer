import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { ICON_INLINE_ALIGN, ICON_SHIM, ICON_SIZE, type LabelSize, type LineBox } from './tokens';

/**
 * The icon counterpart of `Label` — the wrapper a label's icon goes in so it's positioned
 * *once*. Two modes, both keyed off `size`:
 *
 * - Box mode (default): like `Label`, it fills a standardized line-box height (`lineBox`) via an
 *   asymmetric shim, dropping the icon's optical center onto the label's optical center (see
 *   ICON_SHIM). Use it for an icon standing *beside* the label (e.g. a leading icon in its own
 *   column slot) — an `Icon` and a same-size `Label` then sit on the same grid.
 *
 * - Inline mode (`inline`): the icon flows *within* the text, so it sits right after the last
 *   word and wraps with it (a trailing help/question glyph). There is no line-box to fill here;
 *   the icon is aligned to the text itself via a `vertical-align` offset (see ICON_INLINE_ALIGN),
 *   so `lineBox` is ignored.
 *
 * Pass the raw icon as children (e.g. a react-feather `<HelpCircle />`); the wrapper sizes it to
 * `ICON_SIZE[size]` (any child <svg> is stretched to fill) and inherits the surrounding color via
 * `currentColor`, so inside a `Label` it picks up the label color automatically.
 */
export function Icon({
    size = 'm',
    lineBox = 24,
    inline = false,
    className,
    children,
}: {
    size?: LabelSize;
    lineBox?: LineBox;
    /** Flow inline within the label text (trailing icon after the last word) instead of filling a line-box. */
    inline?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    const box = ICON_SIZE[size];
    const svgFill = '[&_svg]:block [&_svg]:h-full [&_svg]:w-full';

    if (inline) {
        return (
            <span
                className={cn('inline-flex items-center justify-center', svgFill, className)}
                // No line-box: the icon aligns to the text via vertical-align, so it rides the last
                // word and wraps with it. width/height are just the icon itself.
                style={{ height: box, verticalAlign: `${ICON_INLINE_ALIGN[size]}px`, width: box }}
            >
                {children}
            </span>
        );
    }

    // Box mode. Fall back to a no-op shim if an unsupported (size × line-box) combo is requested.
    const [paddingTop, paddingBottom] = ICON_SHIM[size][lineBox] ?? [0, 0];

    return (
        <span
            className={cn('inline-flex flex-none items-center justify-center align-top', svgFill, className)}
            // content-box: width/height are the icon itself; the shim padding adds on top so the
            // total box height is exactly `lineBox` (pt + box + pb === lineBox — see ICON_SHIM).
            style={{ boxSizing: 'content-box', height: box, paddingBottom, paddingTop, width: box }}
        >
            {children}
        </span>
    );
}
