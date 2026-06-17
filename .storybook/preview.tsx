import '@/app/styles/styles.css';

import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import React from 'react';

import { rubikFont } from '@/app/styles';

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

const preview: Preview = {
    parameters: {
        a11y: {
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
        Story => {
            return (
                <>
                    {/* Mirror app/layout.tsx: define --explorer-default-font on :root so body
                        (and portal-mounted modals/dropdowns) inherit Rubik via styles.css. */}
                    <style>{`:root { --explorer-default-font: ${rubikFont.style.fontFamily}; }`}</style>
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
