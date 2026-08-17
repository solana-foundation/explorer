// Type + baseline tokens for the Label / KeyValue primitives.
//
// The idea: every Label keeps its own *tight* line-height but is padded top/bottom so its
// box fills a standardized line-box height (20 / 24 / 32) AND its text baseline lands on
// that line-box's shared baseline. The padding is asymmetric on purpose — a symmetric pad
// would center the glyph; the extra weight on top drops the baseline down onto the grid so a
// small label sits on the same baseline as larger body text.

export type LabelSize = 's' | 'm' | 'l' | 'xl';
export type LineBox = 16 | 20 | 24 | 32 | 36 | 40;

// Font sizes + line-heights are the Tailwind default type scale (px). Each label size maps to
// the nearest standard Tailwind step per the dk → Tailwind migration:
//   s → text-xs (12/16),  m → text-sm (14/20),  l → text-base (16/24),  xl → text-lg (18/28)
export const LABEL_FONT: Record<LabelSize, { fontSize: number; lineHeight: number }> = {
    l: { fontSize: 16, lineHeight: 24 },
    m: { fontSize: 14, lineHeight: 20 },
    s: { fontSize: 12, lineHeight: 16 },
    xl: { fontSize: 18, lineHeight: 28 },
};

// [paddingTop, paddingBottom] per (size × line-box). Invariant: pt + lineHeight + pb === lineBox.
// Values computed at ascent≈0.8, anchored to the `l` baseline; every other size is padded to land
// on that same baseline, then rounded to whole px. Inner map is Partial: a size only lists
// line-boxes it fits (line-box must be ≥ its Tailwind line-height).
export const LABEL_SHIM: Record<LabelSize, Partial<Record<LineBox, [number, number]>>> = {
    l: { 24: [0, 0], 32: [4, 4], 36: [6, 6], 40: [8, 8] },
    m: { 20: [0, 0], 24: [3, 1], 32: [7, 5], 36: [9, 7], 40: [11, 9] },
    s: { 16: [0, 0], 20: [3, 1], 24: [5, 3], 32: [9, 7], 36: [11, 9], 40: [13, 11] },
    xl: { 32: [1, 3], 36: [3, 5], 40: [5, 7] },
};

// --- Icon tokens ---------------------------------------------------------------
// A label may carry an icon (a help/link/status glyph). The icon gets its own wrapper
// (see Icon.tsx) that is the exact parallel of Label: it fills the same standardized
// line-box and is positioned *once* here so any icon dropped beside a label lines up.

// Icon edge length (px) per label size. Even numbers render crisper for react-feather; each is
// the smallest even ≥ label font + 1, so the icon stays ~1 step above the (Tailwind) label font.
//   s → 14,  m → 16,  l → 18,  xl → 20
export const ICON_SIZE: Record<LabelSize, number> = {
    l: 18,
    m: 16,
    s: 14,
    xl: 20,
};

// [paddingTop, paddingBottom] per (size × line-box) for the icon box.
// Invariant: pt + ICON_SIZE[size] + pb === lineBox (the box fills the line-box, like Label).
// Padding is asymmetric to drop the icon's *optical center* onto the label text's optical center
// within the same line-box, so an icon and a same-size Label sit on one grid.
export const ICON_SHIM: Record<LabelSize, Partial<Record<LineBox, [number, number]>>> = {
    l: { 20: [0, 2], 24: [2, 4], 32: [6, 8], 36: [8, 10], 40: [10, 12] },
    m: { 16: [0, 0], 20: [2, 2], 24: [4, 4], 32: [8, 8], 36: [10, 10], 40: [12, 12] },
    s: { 16: [2, 0], 20: [4, 2], 24: [6, 4], 32: [10, 8], 36: [12, 10], 40: [14, 12] },
    xl: { 20: [0, 0], 24: [1, 3], 32: [5, 7], 36: [7, 9], 40: [9, 11] },
};

// `vertical-align` offset (px, positive = raised) for an icon flowing *inline* after the label
// text — e.g. a trailing help/question glyph that must sit after the last word and wrap with it.
// An inline-block's baseline is its bottom edge, so this raises the icon's bottom above the text
// baseline until the icon's optical center lands on the text's (≈ capHeight/2 above baseline).
export const ICON_INLINE_ALIGN: Record<LabelSize, number> = {
    l: -3.5,
    m: -3,
    s: -3,
    xl: -3.5,
};
