import type { jsPDF } from 'jspdf';

// Latin-only TTFs served from /public/fonts/.
// Rubik (sans) — matches the receipt Figma. Regular + SemiBold weights.
// Roboto Mono (mono) — used for addresses / signature / amounts. Regular + SemiBold.
const FONT_PATHS = {
    robotoMonoRegular: '/fonts/RobotoMono-Regular.ttf',
    robotoMonoSemiBold: '/fonts/RobotoMono-SemiBold.ttf',
    rubikRegular: '/fonts/Rubik-Regular.ttf',
    rubikSemiBold: '/fonts/Rubik-SemiBold.ttf',
} as const;

export type PdfFonts = Record<keyof typeof FONT_PATHS, string>;

let cached: Promise<PdfFonts> | undefined;

export function loadPdfFonts(): Promise<PdfFonts> {
    if (!cached) {
        cached = (async () => {
            const entries = await Promise.all(
                (Object.entries(FONT_PATHS) as Array<[keyof typeof FONT_PATHS, string]>).map(
                    async ([key, path]) => [key, await fetchAsBase64(path)] as const,
                ),
            );
            return Object.fromEntries(entries) as PdfFonts;
        })().catch(error => {
            // Drop the rejected promise so a transient font-fetch failure (e.g. CDN blip)
            // doesn't permanently break downloads for the session — the next call retries.
            cached = undefined;
            throw error;
        });
    }
    return cached;
}

// jsPDF.addFileToVFS expects a base64 string, not raw bytes. FileReader's
// readAsDataURL produces "data:...;base64,<payload>" — we keep just the payload.
async function fetchAsBase64(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',', 2)[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

export function registerPdfFonts(doc: jsPDF, fonts: PdfFonts): void {
    doc.addFileToVFS('Rubik-Regular.ttf', fonts.rubikRegular);
    doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
    doc.addFileToVFS('Rubik-SemiBold.ttf', fonts.rubikSemiBold);
    doc.addFont('Rubik-SemiBold.ttf', 'Rubik', 'bold');
    doc.addFileToVFS('RobotoMono-Regular.ttf', fonts.robotoMonoRegular);
    doc.addFont('RobotoMono-Regular.ttf', 'RobotoMono', 'normal');
    doc.addFileToVFS('RobotoMono-SemiBold.ttf', fonts.robotoMonoSemiBold);
    doc.addFont('RobotoMono-SemiBold.ttf', 'RobotoMono', 'bold');
}
