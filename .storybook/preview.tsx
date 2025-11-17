import type { Preview } from '@storybook/react';
import React, { useEffect } from 'react';

import { Rubik } from 'next/font/google';
import './layout.min.css'; // uncomment this line to see Dashkit styles. TODO: remove upon migrating from Dashkit to Tailwind
import './dashkit-polyfill.css';
import '@/app/styles.css';

// Load font with display: swap for better loading behavior
const rubikFont = Rubik({
    display: 'swap',
    preload: true,
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

const preview: Preview = {
    parameters: {
        backgrounds: {
            options: {
                dark: { name: 'Dark', value: '#161a19' },
                card: { name: 'Card', value: '#1e2423' },
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },

    decorators: [
        Story => {
            // Add useEffect to ensure font is properly loaded
            useEffect(() => {
                document.getElementById('storybook-outer')?.classList.add(rubikFont.className);
            }, [rubikFont]);

            return (
                <div id="storybook-outer" className={rubikFont.className}>
                    <Story />
                </div>
            );
        },
    ],

    initialGlobals: {
        backgrounds: {
            value: 'dark',
        },
    },
};

export default preview;
