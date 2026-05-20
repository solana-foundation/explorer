import type { Config } from 'tailwindcss';

const breakpoints = new Map([
    ['xxs', 320],
    ['xs', 375],
    ['sm', 576],
    ['md', 768],
    ['lg', 992],
    ['xl', 1200],
    ['xxl', 1400],
]);

// dashkit migration tokens — sourced from app/scss/dashkit/_variables.scss after _solana-variables.scss overrides.
// Phase 2 replaces Bootstrap classes with `e-*-dk-*` utilities; Phase 3 deletes these once dashkit is gone.
//
// IMPORTANT: explorer renders dark-only today. Entries tagged `// light` below are unused at runtime —
// they're kept here so the migration mirrors the SCSS variable names 1:1 and stays easy to audit.
// When a real light theme lands, rename these to their light-theme equivalents (e.g. `gray-100` →
// `light-gray-100` or move under a `light` namespace) and drop this note.
const dkSpacer = '1.5rem';
const dkColors = {
    white: '#ffffff',
    black: '#232323',
    'black-dark': '#141816',
    'gray-100': '#f9fdfc', // light — unused at runtime; rename when light theme lands
    'gray-200': '#f1f8f6', // light — unused at runtime
    'gray-300': '#e5ebe9', // light — unused at runtime
    'gray-400': '#c6e6de', // light — unused at runtime
    'gray-500': '#abd5c6', // light — unused at runtime
    'gray-600': '#86b8b6', // shared light+dark (solana keeps this value in dark)
    'gray-700': '#698582', // light — unused at runtime
    'gray-800': '#387462', // light — unused at runtime
    'gray-900': '#1b4e3f', // light — unused at runtime
    'gray-600-dark': '#343a37',
    'gray-700-dark': '#282d2b',
    'gray-800-dark': '#1e2423',
    primary: '#42ba96', // light — unused at runtime; dark uses `primary-on-dark`
    'primary-dark': '#33a382', // active/link color (both themes)
    'primary-on-dark': '#1dd79b',
    success: '#19be56', // light — unused at runtime; dark uses `success-on-dark`
    'success-on-dark': '#26e97e',
    info: '#43b5c5', // shared light+dark
    warning: '#d83aeb', // light — unused at runtime; dark uses `warning-on-dark`
    'warning-on-dark': '#fa62fc',
    danger: '#b45be1', // shared light+dark
    'rainbow-1': '#fa62fc',
    'rainbow-2': '#be84e8',
    'rainbow-3': '#79abd2',
    'rainbow-4': '#38d0bd',
    'rainbow-5': '#1dd79b',
    'popover-bg': '#1A1A1A',
    'popover-border': 'rgba(255,255,255,0.1)',
    'card-outline-dark': '#111',
    'input-placeholder-dark': '#ccc',
};

// Phase-2 refactor map — Bootstrap class → Tailwind utilities. Append to this table when you
// convert a new class family; delete entries as they go to zero usage.
//
//   .btn-white / .btn-light (dark theme, in app/scss/dashkit/dark/_overrides-dark.scss)
//     background-color : idle → e-bg-dk-gray-800-dark      active/hover → e-bg-dk-black-dark
//     border-color     : idle → e-border-dk-gray-600-dark  active/hover → e-border-dk-gray-700-dark
//     color            : e-text-dk-white
//
//   .btn-black.active  → e-shadow-active   (= 0 0 0 0.15rem #33a382, already declared above)
//
//   .card              → e-bg-dk-gray-800-dark e-border-dk-gray-700-dark e-rounded-dk-lg e-shadow-dk-card
//   .card-header       → e-px-dk-4 e-py-4  (cap padding; consider adding dk-cap-py later)
//   .card-body         → e-px-dk-4 e-py-dk-4
//
//   .text-muted        → e-text-dk-gray-600              (light theme)  /  e-text-dk-gray-700 (dark)
//   .text-rainbow-N    → e-text-dk-rainbow-{1..5}
//   .bg-rainbow-N      → e-bg-dk-rainbow-{1..5}

const config: Config = {
    content: ['./app/**/*.{ts,tsx}'],
    plugins: [],
    prefix: 'e-',
    theme: {
        extend: {
            boxShadow: {
                // border for active states from Dashkit
                active: '0 0 0 0.15rem #33a382',
                'active-sm': '0 0 0 1px #33a382',
                'dk-card': '0 0.75rem 1.5rem rgba(20, 24, 22, 0.5)',
                'dk-lift': '0 1rem 2.5rem rgba(35, 35, 35, 0.1), 0 0.5rem 1rem -0.75rem rgba(35, 35, 35, 0.1)',
            },
            borderRadius: {
                'dk-xs': '0.1875rem',
                'dk-sm': '0.25rem',
                dk: '0.375rem',
                'dk-lg': '0.5rem',
                'dk-pill': '200px',
            },
            fontSize: {
                'dk-xs': '0.625rem',
                'dk-sm': '0.8125rem',
                'dk-base': '0.9375rem',
                'dk-lg': '1.0625rem',
                'dk-h1': '1.625rem',
                'dk-h2': '1.25rem',
                'dk-h3': '1.0625rem',
                'dk-h4': '0.9375rem',
                'dk-h5': '0.8125rem',
                'dk-h6': '0.625rem',
            },
            spacing: {
                'dk-1': '0.1875rem',
                'dk-2': '0.375rem',
                'dk-3': '0.75rem',
                'dk-4': dkSpacer,
                'dk-5': '2.25rem',
                'dk-6': '4.5rem',
                'dk-7': '6.75rem',
                'dk-8': '13.5rem',
            },
            colors: {
                dk: dkColors,
                // TODO: replace with e-text-neutral-400
                muted: 'oklch(0.6406 0.0038 174.41)', // #8a8d8c
                'heavy-metal': {
                    DEFAULT: 'oklch(21.275% 0.00721 164.22)',
                    50: 'oklch(83.058% 0.01201 161.99)',
                    100: 'oklch(80.062% 0.01471 162.38)',
                    200: 'oklch(73.7% 0.0195 166.17)',
                    300: 'oklch(67.255% 0.0243 164.16)',
                    400: 'oklch(61.003% 0.02932 162.63)',
                    500: 'oklch(53.552% 0.02379 165.43)',
                    600: 'oklch(46.048% 0.0207 163.91)',
                    700: 'oklch(38.258% 0.0166 166.31)',
                    800: 'oklch(30.098% 0.01205 160.58)',
                    900: 'oklch(21.275% 0.00721 164.22)',
                    950: 'oklch(14.676% 0.004 164.84)',
                },
                'outer-space': {
                    DEFAULT: 'oklch(24.975% 0.0089 184.49)',
                    50: 'oklch(85.627% 0.01017 181.36)',
                    100: 'oklch(82.682% 0.01236 184.01)',
                    200: 'oklch(76.402% 0.01689 187.2)',
                    300: 'oklch(70.297% 0.0218 185.24)',
                    400: 'oklch(63.845% 0.02549 186.53)',
                    500: 'oklch(56.852% 0.02498 185.95)',
                    600: 'oklch(49.437% 0.02229 184.23)',
                    700: 'oklch(41.81% 0.01838 180.95)',
                    800: 'oklch(33.501% 0.01351 189.14)',
                    900: 'oklch(24.975% 0.0089 184.49)',
                    950: 'oklch(18.651% 0.00656 178.83)',
                },
                success: {
                    DEFAULT: 'oklch(81.199% 0.21286 150.43)',
                    50: 'oklch(94.241% 0.06038 158.29)',
                    100: 'oklch(92.351% 0.0819 157.87)',
                    200: 'oklch(88.995% 0.1209 156.56)',
                    300: 'oklch(85.751% 0.15657 154.88)',
                    400: 'oklch(83.255% 0.18729 152.88)',
                    500: 'oklch(81.199% 0.21286 150.43)',
                    600: 'oklch(70.211% 0.18984 149.72)',
                    700: 'oklch(56.135% 0.14911 150.19)',
                    800: 'oklch(40.792% 0.10476 150.91)',
                    900: 'oklch(24.184% 0.05582 152.49)',
                    950: 'oklch(14.75% 0.02671 160.13)',
                },
                accent: {
                    DEFAULT: 'oklch(78.205% 0.16457 163.86)',
                    50: 'oklch(95.434% 0.04741 174.98)',
                    100: 'oklch(93.711% 0.06435 174.15)',
                    200: 'oklch(90.641% 0.09895 172.33)',
                    300: 'oklch(88.039% 0.12838 170.21)',
                    400: 'oklch(85.607% 0.1515 168.18)',
                    500: 'oklch(83.887% 0.16905 165.28)',
                    600: 'oklch(78.205% 0.16457 163.86)',
                    700: 'oklch(63.757% 0.13274 164.38)',
                    800: 'oklch(48.731% 0.09993 164.76)',
                    900: 'oklch(32.092% 0.06281 166.71)',
                    950: 'oklch(23.271% 0.04416 166.83)',
                },
                destructive: {
                    DEFAULT: 'oklch(73.321% 0.26321 327.1)',
                    50: 'oklch(100% 0 none)',
                    100: 'oklch(98.649% 0.01179 325.67)',
                    200: 'oklch(91.008% 0.07816 325.51)',
                    300: 'oklch(84.08% 0.14565 326.37)',
                    400: 'oklch(78.019% 0.20967 326.45)',
                    500: 'oklch(73.321% 0.26321 327.1)',
                    600: 'oklch(69.433% 0.30783 327.38)',
                    700: 'oklch(63.075% 0.29011 327.38)',
                    800: 'oklch(51.151% 0.23484 327.4)',
                    900: 'oklch(38.481% 0.17603 327.43)',
                    950: 'oklch(31.567% 0.1435 327.16)',
                },
            },
            gridTemplateColumns: {
                // Grid template for TokenExtensions
                '12-ext': 'repeat(12, minmax(0, 1fr))',
            },
        },

        screens: {
            'max-sm': getScreenDim('sm', -1),
            'max-md': getScreenDim('md', -1),
            xxs: getScreenDim('xxs'),
            xs: getScreenDim('xs'),
            sm: getScreenDim('sm'),
            md: getScreenDim('md'),
            lg: getScreenDim('lg'),
            xl: getScreenDim('xl'),
            xxl: getScreenDim('xxl'),
            mobile: getScreenDim('sm'),
            tablet: getScreenDim('md'),
            laptop: getScreenDim('lg'),
            desktop: getScreenDim('xl'),
        },
    },
};

export default config;

// adjust breakpoint 1px up see previous layout on the "edge"
function getScreenDim(label: string, shift = 1) {
    const a = breakpoints.get(label);
    if (!a) throw new Error(`Unknown breakpoint: ${label}`);
    return `${a + shift}px`;
}
