const prettierConfigSolana = require('@solana/prettier-config-solana');

module.exports = {
    ...prettierConfigSolana,
    plugins: [prettierConfigSolana.plugins ?? []].concat(['prettier-plugin-tailwindcss']),
    endOfLine: 'lf',
    overrides: [
        ...(prettierConfigSolana.overrides ?? []),
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
