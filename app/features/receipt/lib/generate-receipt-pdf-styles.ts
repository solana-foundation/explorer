import type { jsPDF } from 'jspdf';

export const COLORS = {
    border: '#cccccc',
    dark: '#1a1a1a',
    divider: '#e5e5e5',
    fieldBg: '#f5f5f5',
    light: '#999999',
    mid: '#555555',
} as const;

export const PAGE = {
    contentWidth: 170,
    height: 297,
    marginX: 20,
    width: 210,
} as const;

export const HELVETICA = 'helvetica' as const;
export const COURIER = 'courier' as const;
export const NORMAL = 'normal' as const;
export const BOLD = 'bold' as const;

export type TextStyle = {
    font: typeof HELVETICA | typeof COURIER;
    weight: typeof NORMAL | typeof BOLD;
    size: number;
    color: string;
    uppercase?: boolean;
};

export const TEXT_STYLES = {
    caption: { color: COLORS.light, font: HELVETICA, size: 6, weight: NORMAL },
    disclaimer: { color: COLORS.light, font: HELVETICA, size: 7, weight: NORMAL },
    label: { color: COLORS.mid, font: HELVETICA, size: 8, uppercase: true, weight: BOLD },
    logoFallback: { color: COLORS.dark, font: HELVETICA, size: 9, weight: BOLD },
    sectionTitle: { color: COLORS.dark, font: HELVETICA, size: 10, weight: BOLD },
    subtitle: { color: COLORS.light, font: HELVETICA, size: 9, weight: NORMAL },
    title: { color: COLORS.dark, font: HELVETICA, size: 16, weight: BOLD },
    totalLabel: { color: COLORS.dark, font: HELVETICA, size: 8, weight: BOLD },
    value: { color: COLORS.dark, font: HELVETICA, size: 8, weight: NORMAL },
    valueMono: { color: COLORS.dark, font: COURIER, size: 8, weight: NORMAL },
} as const satisfies Record<string, TextStyle>;

export type LineStyle = { color: string; width: number };

export const LINE_STYLES = {
    border: { color: COLORS.border, width: 0.2 },
    divider: { color: COLORS.divider, width: 0.3 },
} as const satisfies Record<string, LineStyle>;

export function applyTextStyle(doc: jsPDF, style: TextStyle): void {
    doc.setFont(style.font, style.weight);
    doc.setFontSize(style.size);
    doc.setTextColor(style.color);
}

export function formatText(text: string, style: TextStyle): string {
    return style.uppercase ? text.toUpperCase() : text;
}

export function applyLineStyle(doc: jsPDF, style: LineStyle): void {
    doc.setDrawColor(style.color);
    doc.setLineWidth(style.width);
}
