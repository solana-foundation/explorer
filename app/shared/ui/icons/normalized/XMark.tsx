import { BASE_GRID, NormalizedIcon } from './base';

/**
 * X's brand mark on the normalized grid.
 *
 * The mark is a filled path inking its whole 11-unit box, so at an equal box size it reads larger and
 * heavier than the stroked glyphs beside it. Placing it on the 24 grid at `INK_SPAN` units matches
 * the family's three-quarter coverage, so no call site has to compensate with a smaller box. Stroke
 * rules do not apply — a filled glyph has no line, so ink coverage is its only shared lever.
 */
const INK_SPAN = 18;
const SOURCE_SPAN = 11;
const PLACEMENT = `translate(${(BASE_GRID - INK_SPAN) / 2} ${(BASE_GRID - INK_SPAN) / 2}) scale(${INK_SPAN / SOURCE_SPAN})`;

interface NormalizedXMarkProps {
    className?: string;
    size?: number;
}

export function NormalizedXMark({ className, size }: NormalizedXMarkProps) {
    return (
        <NormalizedIcon aria-hidden="true" className={className} fill="none" size={size}>
            <path
                fill="currentColor"
                transform={PLACEMENT}
                d="M8.65 0h1.65L6.695 4.14l4.25 6.86H7.64L5.08 7.155 2.15 11H.49l3.865-4.43L.28 0h3.385L5.99 3.53zm-.575 9.88h.915L3.19.94h-.98z"
            />
        </NormalizedIcon>
    );
}
