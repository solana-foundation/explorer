import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./app/**/*.{ts,tsx}'],
    plugins: [],
    prefix: 'e-',
    theme: {
        extend: {
            boxShadow: {
                active: '0 0 0 0.15rem #33a382',
            },
            gridTemplateColumns: {
                // Grid template for TokenExtensions
                '12-ext': 'minmax(22rem, 1fr), repeat(11, minmax(0, 1fr))',
            },
        },
        screens: {
            xs: '576px',
            sm: '768px',
            md: '992px',
            lg: '1200px',
            xl: '1400px',
            mobile: '576px',
            tablet: '768px',
            laptop: '992px',
            desktop: '1200px',
            'max-xs': '575px',
            'max-sm': '767px',
        },
    },
};

export default config;
