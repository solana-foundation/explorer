import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
    // Global ignores
    {
        ignores: ['dist/**', 'lib/**', '.next/**', '.next-dev/**', 'node_modules/**', '.claude/**'],
    },

    // Next.js config via compat (still legacy format in v15)
    ...compat.extends('next/core-web-vitals'),

    // Base configs (after compat so tseslint parser takes precedence)
    ...tseslint.configs.recommended,

    // Main config
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'warn',
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            'simple-import-sort': simpleImportSort,
            'sort-keys-fix': sortKeysFix,
            '@eslint-community/eslint-comments': eslintComments,
        },
        rules: {
            semi: ['error', 'always'],
            '@typescript-eslint/no-explicit-any': 'off',
            'object-curly-spacing': ['error', 'always'],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {
                    allowShortCircuit: true,
                    allowTernary: true,
                },
            ],
            'no-unused-vars': 'off',
            'simple-import-sort/imports': 'error',
            'no-restricted-globals': ['error', 'RegExp'],
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'Literal[regex]',
                    message:
                        'RegExps are not recommended. If you sure regexp is needed - please use eslint-disable-next no-restricted-syntax -- %comment%  to explain why',
                },
                {
                    selector: 'RegExpLiteral',
                    message:
                        'RegExps are not recommended. If you sure regexp is needed - please use eslint-disable-next no-restricted-syntax -- %comment%  to explain why',
                },
            ],
            'sort-keys-fix/sort-keys-fix': 'error',
            '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
            'no-console': 'error',
        },
    },

    // Allow require() in CommonJS and script files
    {
        files: ['**/*.cjs', '**/*.js'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },

    // Testing library config for test files
    {
        files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
        ...testingLibrary.configs['flat/react'],
    },

    // Allow unlimited disable in mock files
    {
        files: ['**/mocks/**/*.[jt]s?(x)'],
        rules: {
            '@eslint-community/eslint-comments/no-unlimited-disable': 'off',
        },
    },

    // Allow console in logger, scripts, standalone files, pnpmfile
    {
        files: ['app/shared/lib/logger.ts', 'scripts/**', '**/*.mjs', '**/*.cjs'],
        rules: {
            'no-console': 'off',
        },
    },

    // Relax sort-keys in config/tooling files (not linted by next lint before)
    {
        files: ['*.config.*', '**/*.mjs', '**/*.cjs', '.storybook/**', 'scripts/**', '.prettierrc.cjs'],
        rules: {
            'sort-keys-fix/sort-keys-fix': 'off',
        },
    },

    // Restrict @sentry/nextjs imports in app code
    {
        files: ['app/**/*.[jt]s?(x)'],
        ignores: ['app/shared/lib/sentry/**', 'app/shared/lib/logger.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@sentry/nextjs',
                            message:
                                "Import from '@/app/shared/lib/sentry' instead. For logging, use the Logger from '@/app/shared/lib/logger'.",
                        },
                    ],
                },
            ],
        },
    },
);
