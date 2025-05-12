const prettierConfigSolana = require('@solana/prettier-config-solana');

/** @type {import("prettier").Config} */
module.exports = {
    ...prettierConfigSolana,
    plugins: [prettierConfigSolana.plugins ?? []].concat(['prettier-plugin-tailwindcss']),
    endOfLine: 'lf',
};
