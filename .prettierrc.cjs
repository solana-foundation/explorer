const prettierConfigSolana = require('@solana/prettier-config-solana');

module.exports = {
    ...prettierConfigSolana,
    plugins: [prettierConfigSolana.plugins ?? []].concat(['prettier-plugin-tailwindcss']),
    endOfLine: 'lf',
};
