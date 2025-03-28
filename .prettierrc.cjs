const solanaPrettierConfig = require('@solana/prettier-config-solana');

/** @type {import("prettier").Config} */
module.exports = {
    ...solanaPrettierConfig,
    endOfLine: 'lf',
    plugins: [
        // prettier-plugin-tailwindcss will be loaded automatically by Prettier
    ],
    overrides: [
        {
            files: '*.{ts,tsx,mts,mjs}',
            options: {
                parser: 'typescript',
            },
        },
        {
            files: '*.{json,md}',
            options: {
                singleQuote: false,
            },
        },
    ],
};