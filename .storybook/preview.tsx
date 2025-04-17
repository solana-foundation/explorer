import type { Preview } from '@storybook/react';
import React from 'react';

import { Rubik } from 'next/font/google';
// import './layout.min.css';
import '@/app/styles.css';

const rubikFont = Rubik({
    display: 'auto',
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

const preview: Preview = {
    parameters: {
        backgrounds: {
            values: [{ name: 'Dark', value: '#161b19' }],
            default: 'Dark',
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        Story => (
            <div id="storybook-outer" className={rubikFont.className}>
                <Story />
            </div>
        ),
    ],
};

export default preview;
