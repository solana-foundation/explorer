import type { ReactNode, SVGProps } from 'react';

/**
 * The shared grid for normalized icons.
 *
 * "Normalized" means an icon brought onto our grid rather than left on whatever grid it shipped
 * with: every glyph is authored on a 24-unit box, inking about three quarters of it, and is drawn at
 * one display size. That is the grid react-feather already uses, so its icons pass through untouched
 * and only the odd ones out need placing — a brand mark that fills its whole box gets padded down, a
 * chevron that inks a quarter of its box gets scaled up.
 *
 * Sizing a glyph at the call site is what this replaces: the box is uniform, and the optical work
 * happens inside the viewBox.
 *
 * One rule holds across the whole family: at the base grid every stroke is `BASE_STROKE` units wide.
 * Thickness then scales with the display size and never with the individual glyph, so two icons drawn
 * at the same size always carry the same line — enlarging a glyph's ink must not thicken its stroke.
 */
export const BASE_GRID = 24;
export const BASE_STROKE = 2;
export const DISPLAY_SIZE = 16;

interface NormalizedIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> {
    children: ReactNode;
    /** Rendered box in px. Everything scales with it; the grid inside stays 24. */
    size?: number;
}

/**
 * The box is pinned inline because ancestors carry `[&_svg]:size-*` rules (every Button size
 * compound emits one) that would beat a class here and silently resize the glyph.
 */
export function NormalizedIcon({ children, size = DISPLAY_SIZE, ...props }: NormalizedIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={`0 0 ${BASE_GRID} ${BASE_GRID}`}
            style={{ height: size, width: size }}
            {...props}
        >
            {children}
        </svg>
    );
}

/**
 * Scales a glyph about the centre of the grid. It scales the stroke along with the geometry, so a
 * scaled glyph has to divide `BASE_STROKE` by the same factor to land back on the family's stroke.
 */
export function inkScale(factor: number) {
    const centre = BASE_GRID / 2;
    return `translate(${centre} ${centre}) scale(${factor}) translate(-${centre} -${centre})`;
}
