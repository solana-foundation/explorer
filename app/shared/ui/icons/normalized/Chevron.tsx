import { BASE_STROKE, inkScale, NormalizedIcon } from './base';

/**
 * Chevrons on the normalized grid.
 *
 * A chevron inks only a quarter of the 24 box, so beside a filled-out glyph like `Download` it reads
 * much lighter. `INK_SCALE` enlarges the geometry inside the shared box, and the stroke is divided by
 * the same factor so it lands back on the family's `BASE_STROKE` — bigger mark, identical line.
 * Geometry is feather's own (MIT), kept verbatim so the shape stays familiar.
 */
const INK_SCALE = 1.25;
const STROKE = BASE_STROKE / INK_SCALE;

interface NormalizedChevronProps {
    className?: string;
    size?: number;
}

export function NormalizedChevronDown({ className, size }: NormalizedChevronProps) {
    return (
        <NormalizedIcon aria-hidden="true" className={className} size={size}>
            <polyline
                points="6 9 12 15 18 9"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={STROKE}
                transform={inkScale(INK_SCALE)}
            />
        </NormalizedIcon>
    );
}

export function NormalizedChevronLeft({ className, size }: NormalizedChevronProps) {
    return (
        <NormalizedIcon aria-hidden="true" className={className} size={size}>
            <polyline
                points="15 18 9 12 15 6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={STROKE}
                transform={inkScale(INK_SCALE)}
            />
        </NormalizedIcon>
    );
}
