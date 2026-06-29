import '@/app/styles/styles.css';

import { initialize, mswLoader } from 'msw-storybook-addon';
import React from 'react';

import { rubikFont } from '@/app/styles';

import type { Preview } from './types';

// MSW is opt-in: STORYBOOK_MSW=true registers the service worker so stories with
// `parameters.msw.handlers` mock network calls. Off by default so normal runs are untouched.
const mswEnabled = process.env.STORYBOOK_MSW === 'true';

if (mswEnabled) {
    initialize();
}

// Storybook serialises story args with JSON.stringify (for the controls panel and inter-frame
// messaging), which throws on BigInt. Story fixtures here use BigInt for lamports / epoch values,
// so teach BigInt how to encode itself as a string.

declare global {
    interface BigInt {
        toJSON(): string;
    }
}

BigInt.prototype.toJSON = function () {
    return this.toString();
};

// The autodocs Primary block sits under #anchor--primary--<id>, which the backgrounds addon never
// targets, so mirror the selected background onto a CSS var the inner panel reads (preview-head.html).
function SelectedBackgroundBridge({ value }: { value?: string }) {
    React.useEffect(() => {
        const root = document.documentElement;
        if (value) root.style.setProperty('--sb-doc-bg', value);
        else root.style.removeProperty('--sb-doc-bg');
    }, [value]);
    return <></>;
}

const preview: Preview = {
    parameters: {
        a11y: {
            // Document-scoped rules that can never pass for a component rendered in isolation (no <main>/<h1>/landmark).
            config: {
                rules: [
                    { enabled: false, id: 'landmark-one-main' },
                    { enabled: false, id: 'page-has-heading-one' },
                    { enabled: false, id: 'region' },
                ],
            },
            test: 'todo',
        },
        backgrounds: {
            options: {
                dark: { name: 'Dark', value: 'var(--background)' },
                card: { name: 'Card', value: 'var(--sb-bg-card)' },
                light: { name: 'Light', value: 'var(--sb-bg-light)' },
            },
        },
        controls: {
            matchers: {
                // eslint-disable-next-line no-restricted-syntax -- Storybook controls matcher requires regex to match arg names
                color: /(background|color)$/i,
                // eslint-disable-next-line no-restricted-syntax -- Storybook controls matcher requires regex to match arg names
                date: /Date$/i,
            },
        },
        layout: 'padded',
        options: {
            // Deterministic sidebar order: alphabetical, with `Design System` groups first
            // and `Responsive` groups last among siblings. Must be self-contained — Storybook
            // stringifies this function.
            storySort: (a, b) => {
                if (a.title === b.title) return 0; // keep story definition order within a file
                const ap = a.title.split('/');
                const bp = b.title.split('/');
                for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
                    const as = ap[i] ?? '';
                    const bs = bp[i] ?? '';
                    if (as === bs) continue;
                    if (as === 'Design System') return -1;
                    if (bs === 'Design System') return 1;
                    if (as === 'Responsive') return 1;
                    if (bs === 'Responsive') return -1;
                    return as.localeCompare(bs, undefined, { numeric: true });
                }
                return 0;
            },
        },
    },

    decorators: [
        (Story, context) => {
            const selected = context.globals?.backgrounds?.value;
            const resolved = selected ? context.parameters?.backgrounds?.options?.[selected]?.value : undefined;
            return (
                <>
                    {/* Mirror app/layout.tsx: define --explorer-default-font on :root so body
                        (and portal-mounted modals/dropdowns) inherit Rubik via styles.css. */}
                    <style>{`:root { --explorer-default-font: ${rubikFont.style.fontFamily}; }`}</style>
                    <SelectedBackgroundBridge value={resolved} />
                    <div id="storybook-outer">
                        <Story />
                    </div>
                </>
            );
        },
    ],

    initialGlobals: {
        backgrounds: {
            value: 'dark',
        },
    },

    loaders: mswEnabled ? [mswLoader] : [],
};

export default preview;
