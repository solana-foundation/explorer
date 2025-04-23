import type { Preview } from '@storybook/react';
import React from 'react';

import { Rubik } from 'next/font/google';
import './layout.min.css'; // uncomment this line to see Dashkit styles
import './dashkit-polyfill.css';
import '@/app/styles.css';

const rubikFont = Rubik({
    display: 'auto',
    preload: true,
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

const preview: Preview = {
    parameters: {
        backgrounds: {
            values: [{ name: 'Dark', value: '#161a19' }],
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
        Story => {
            return (
                <div id="storybook-outer" style={rubikFont.style} className={rubikFont.className}>
                    <Story />
                </div>
            );
        },
    ],
};

export default preview;
