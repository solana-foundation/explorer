import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./app/**/*.{ts,tsx}'],
    prefix: 'e-',
    plugins: [],
    theme: {
        extend: {},
        screens: {
            'xs': '576px',
            'sm': '768px',
            'md': '992px',
            'lg': '1200px',
            'xl': '1400px',
            'mobile': '576px',
            'tablet': '768px',
            'laptop': '992px',
            'desktop': '1200px',
            'max-xs': '575px',
            'max-sm': '767px'
        }
    },
};

export default config;
