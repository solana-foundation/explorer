const prettierConfigSolana = require('@solana/prettier-config-solana');

/** @type {import("prettier").Config} */
module.exports = {
    ...prettierConfigSolana,
    plugins: [...(prettierConfigSolana.plugins ?? []), 'prettier-plugin-tailwindcss'],
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
        {
            files: 'openspec/**/*.md',
            options: {
                proseWrap: 'never',
            },
        },
        // Reflow prose at printWidth so these docs stay readable in a diff and in an editor without soft wrap.
        // Scoped rather than repo-wide: turning it on everywhere would reflow every existing markdown file.
        {
            files: 'app/mcp/**/*.md',
            options: {
                proseWrap: 'always',
            },
        },
    ],
};
