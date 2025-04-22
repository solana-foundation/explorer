import type { Config } from 'tailwindcss';

const breakpoints = new Map([
    ['xxxs', 320],
    ['xxs', 375],
    ['xs', 576],
    ['sm', 768],
]);

const config: Config = {
    content: ['./app/**/*.{ts,tsx}'],
    plugins: [],
    prefix: 'e-',
    theme: {
        extend: {
            boxShadow: {
                // border for active states from Dashkit
                active: '0 0 0 0.15rem #33a382',
            },
            gridTemplateColumns: {
                // Grid template for TokenExtensions
                '12-ext': 'repeat(12, minmax(0, 1fr))',
            },
        },
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        screens: {
            'max-xs': getScreenDim('xs', -1),
            'max-sm': '767px',
            xxxs: getScreenDim('xxxs'),
            xs: getScreenDim('xs'),
            sm: getScreenDim('sm'),
            md: '992px',
            lg: '1200px',
            xl: '1400px',
            mobile: '576px',
            tablet: '768px',
            laptop: '992px',
            desktop: '1200px',
        },
        /* eslint-enable sort-keys-fix/sort-keys-fix */
    },
};

export default config;

// adjust breakpoint 1px up see previous layout on the "edge"
function getScreenDim(label: string, shift = 1) {
    const a = breakpoints.get(label);
    if (!a) throw new Error(`Unknown breakpoint: ${label}`);
    return `${a + shift}px`;
}
