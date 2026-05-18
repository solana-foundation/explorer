import type { jsPDF } from 'jspdf';

export const COLORS = {
    border: '#D1D5DB',
    fieldBg: '#F3F4F6',
    textBody: '#171717',
    textHeading: '#111827',
    textMuted: '#737373',
    textStrong: '#0A0A0A',
    textSubtle: '#6B7280',
    warningBg: '#111827',
    warningText: '#FAFAFA',
} as const;

export const PAGE = {
    contentWidth: 170,
    height: 297,
    marginX: 20,
    width: 210,
} as const;

const COL_WIDTH = PAGE.contentWidth / 2;
const COL_GAP = 4;
export const GRID = {
    col: {
        gap: COL_GAP,
        innerWidth: COL_WIDTH - COL_GAP,
        outerWidth: COL_WIDTH,
    },
} as const;

// Common border radius for inset rounded-rect elements (editable fields, warning bar)
export const BORDER_RADIUS = 1.5;

export const HELVETICA = 'helvetica' as const;
export const COURIER = 'courier' as const;
export const NORMAL = 'normal' as const;
export const BOLD = 'bold' as const;

export type TextStyle = {
    font: typeof HELVETICA | typeof COURIER;
    weight: typeof NORMAL | typeof BOLD;
    size: number;
    color: string;
};

export const TEXT_STYLES = {
    amountDim: { color: COLORS.textMuted, font: HELVETICA, size: 8, weight: BOLD },
    caption: { color: COLORS.textSubtle, font: HELVETICA, size: 6, weight: NORMAL },
    disclaimer: { color: COLORS.textSubtle, font: HELVETICA, size: 7, weight: NORMAL },
    label: { color: COLORS.textMuted, font: HELVETICA, size: 8, weight: NORMAL },
    logoFallback: { color: COLORS.textHeading, font: HELVETICA, size: 9, weight: BOLD },
    sectionTitle: { color: COLORS.textHeading, font: HELVETICA, size: 10, weight: BOLD },
    subtitle: { color: COLORS.textSubtle, font: HELVETICA, size: 9, weight: NORMAL },
    title: { color: COLORS.textHeading, font: HELVETICA, size: 16, weight: BOLD },
    value: { color: COLORS.textBody, font: HELVETICA, size: 8, weight: NORMAL },
    valueMono: { color: COLORS.textBody, font: COURIER, size: 8, weight: NORMAL },
    valueStrong: { color: COLORS.textStrong, font: HELVETICA, size: 8, weight: BOLD },
    valueUsd: { color: COLORS.textMuted, font: HELVETICA, size: 7, weight: NORMAL },
    warning: { color: COLORS.warningText, font: HELVETICA, size: 9, weight: NORMAL },
} as const satisfies Record<string, TextStyle>;

export type LineStyle = { color: string; width: number };

export const LINE_STYLES = {
    border: { color: COLORS.border, width: 0.2 },
} as const satisfies Record<string, LineStyle>;

export function applyTextStyle(doc: jsPDF, style: TextStyle): void {
    doc.setFont(style.font, style.weight);
    doc.setFontSize(style.size);
    doc.setTextColor(style.color);
}

export function applyLineStyle(doc: jsPDF, style: LineStyle): void {
    doc.setDrawColor(style.color);
    doc.setLineWidth(style.width);
}
