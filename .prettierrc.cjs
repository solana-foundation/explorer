const solanaPrettierConfig = require('@solana/prettier-config-solana');

/** @type {import("prettier").Config} */
module.exports = {
    ...solanaPrettierConfig,
    endOfLine: 'lf',
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
