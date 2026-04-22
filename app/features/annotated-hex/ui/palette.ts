import { FieldKind } from '../model/types';

/**
 * Per-region color rotation: every region gets a distinct hue cycling through
 * this list by its index. The legend is the source of truth for "which color
 * is which field" — there is no semantic meaning to a particular hue.
 *
 * Rotation (rather than kind-based coloring) avoids the "why are five fields
 * all green" confusion that an authority/amount/pubkey-kind palette produces
 * on a single account.
 *
 * Each tuple is (cell bg + text, chip bg + text + border) using Tailwind
 * defaults with the repo's `e-` prefix. `/20` opacity on the fill + a 300-shade
 * text keep the hex glyphs readable against both dark and light backgrounds.
 */
const ROTATION: readonly { cell: string; chip: string }[] = [
    {
        cell: 'e-bg-blue-500/20 e-text-blue-300',
        chip: 'e-bg-blue-500/30 e-text-blue-200 e-border-blue-500/40',
    },
    {
        cell: 'e-bg-green-500/20 e-text-green-300',
        chip: 'e-bg-green-500/30 e-text-green-200 e-border-green-500/40',
    },
    {
        cell: 'e-bg-purple-500/20 e-text-purple-300',
        chip: 'e-bg-purple-500/30 e-text-purple-200 e-border-purple-500/40',
    },
    {
        cell: 'e-bg-yellow-500/20 e-text-yellow-300',
        chip: 'e-bg-yellow-500/30 e-text-yellow-200 e-border-yellow-500/40',
    },
    {
        cell: 'e-bg-pink-500/20 e-text-pink-300',
        chip: 'e-bg-pink-500/30 e-text-pink-200 e-border-pink-500/40',
    },
    {
        cell: 'e-bg-cyan-500/20 e-text-cyan-300',
        chip: 'e-bg-cyan-500/30 e-text-cyan-200 e-border-cyan-500/40',
    },
    {
        cell: 'e-bg-orange-500/20 e-text-orange-300',
        chip: 'e-bg-orange-500/30 e-text-orange-200 e-border-orange-500/40',
    },
    {
        cell: 'e-bg-teal-500/20 e-text-teal-300',
        chip: 'e-bg-teal-500/30 e-text-teal-200 e-border-teal-500/40',
    },
];

const NEUTRAL = {
    cell: 'e-bg-neutral-500/10 e-text-neutral-400',
    chip: 'e-bg-neutral-500/30 e-text-neutral-200 e-border-neutral-500/40',
};

/**
 * `kind` is retained as an argument so the `neutral` kind (reserved / unparsed
 * bytes) can be rendered in a muted style regardless of its rotation index.
 * All other kinds rotate through ROTATION.
 */
export function cellClasses(kind: FieldKind, rotationIndex: number): string {
    if (kind === 'neutral') return NEUTRAL.cell;
    return ROTATION[rotationIndex % ROTATION.length].cell;
}

export function chipClasses(kind: FieldKind, rotationIndex: number): string {
    if (kind === 'neutral') return NEUTRAL.chip;
    return ROTATION[rotationIndex % ROTATION.length].chip;
}
