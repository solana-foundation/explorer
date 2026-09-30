import type { OxlintConfig } from 'oxlint';

// Written as CommonJS because package.json has no `"type": "module"`: an ESM `oxlint.config.ts` makes
// Node reparse it on every run and print a MODULE_TYPELESS_PACKAGE_JSON warning.

const JS_TS = '{js,jsx,mjs,cjs,ts,tsx,mts,cts}';

const TEST_AND_STORY_FILES = [
    `**/__tests__/**/*.${JS_TS}`,
    `**/__mocks__/**/*.${JS_TS}`,
    `**/__fixtures__/**/*.${JS_TS}`,
    `**/fixtures/**/*.${JS_TS}`,
    `**/*.{spec,test}.${JS_TS}`,
    `**/*.stories.${JS_TS}`,
];

// Overrides replace `explorer/no-restricted-syntax` options wholesale, so every override must spread
// these back in or it silently drops the RegExp ban for its own files.
const NO_REGEXP_SELECTORS = [
    {
        selector: 'Literal[regex]',
        message:
            'RegExps are not recommended. If you sure regexp is needed - please use eslint-disable-next explorer/no-restricted-syntax -- %comment%  to explain why',
    },
    {
        selector: 'RegExpLiteral',
        message:
            'RegExps are not recommended. If you sure regexp is needed - please use eslint-disable-next explorer/no-restricted-syntax -- %comment%  to explain why',
    },
];

// `'use client'` turns the module into a client reference, which silently neutralises `client-only`:
// the pair reads as guarded while a server caller still fails at runtime instead of at build time.
const CLIENT_MARKER_CONFLICT = {
    selector:
        "Program:has(ExpressionStatement > Literal[value='use client']):has(ImportDeclaration[source.value='client-only'])",
    message:
        "Do not combine 'use client' with `import 'client-only'` — the directive makes the module a client reference, so the marker stops failing the build and a server caller degrades to a runtime error instead. Keep the directive for components; keep only the marker for hooks and plain modules.",
};

// Hooks still on `'use client'`. Per-file so any *new* hook is subject to the rule. This list only
// ever shrinks — a PR that adds an entry is opting a new hook out of the one guard that catches a
// server caller at build time. Removing an entry means swapping the directive for
// `import 'client-only'` and confirming `next build` still passes; a failure names a barrel that
// re-exports the hook onto a server path.
const HOOKS_PENDING_CLIENT_ONLY = [
    'app/entities/account/model/use-account-query.ts',
    'app/entities/cluster/model/use-cluster-connection-failed.ts',
    'app/entities/cluster/model/use-cluster-info.ts',
    'app/entities/cluster/model/use-cluster-modal.ts',
    'app/entities/cluster/model/use-cluster-resource-search.ts',
    'app/entities/cluster/model/use-cluster-url.ts',
    'app/entities/cluster/model/use-cluster.ts',
    'app/entities/cluster/model/use-solana-rpc.ts',
    'app/entities/domain/model/use-user-ans-domains.ts',
    'app/entities/domain/model/use-user-sns-domains.ts',
    'app/entities/idl/model/anchor/use-anchor-program.ts',
    'app/entities/idl/model/anchor/use-format-anchor-idl.ts',
    'app/entities/idl/model/use-format-codama-idl.ts',
    'app/entities/idl/model/use-program-idl-names.ts',
    'app/entities/idl/model/use-program-idls.ts',
    'app/entities/nft/model/use-token-metadata.ts',
    'app/entities/program-metadata/model/use-program-metadata-idl.tsx',
    'app/entities/slot-time/model/use-slot-time.ts',
    'app/entities/token-info/model/use-token-info.ts',
    'app/entities/transaction-data/model/use-resolved-instruction-names.ts',
    'app/features/cluster-switcher/model/use-cluster-href.ts',
    'app/features/cluster-switcher/model/use-custom-url-draft.ts',
    'app/features/cookie/model/use-analytics-consent.ts',
    'app/features/decode-account-pmp/model/use-decode-metadata-payload.ts',
    'app/features/decode-account-pmp/model/use-resolve-buffer-config-from-bytes.ts',
    'app/features/decode-account-pmp/model/use-resolve-buffer-config-onchain.ts',
    'app/features/idl/interactive-idl/model/transaction/use-execute-transaction.ts',
    'app/features/idl/interactive-idl/model/transaction/use-simulate-transaction.ts',
    'app/features/idl/interactive-idl/model/use-instruction.ts',
    'app/features/idl/model/use-tabs.tsx',
    'app/features/instruction-simulation/model/use-simulation.ts',
    'app/features/nicknames/model/use-nickname.ts',
    'app/features/receipt/lib/use-primary-domain.ts',
    'app/features/stake/model/use-total-reward.ts',
    'app/features/supply/model/use-supply.ts',
    'app/features/token-batch/model/use-sub-instruction-mint-info.ts',
    'app/features/transaction-history/model/use-account-history.ts',
    'app/features/transaction-history/model/use-fetch-account-history.ts',
    'app/features/transaction/model/use-cluster-transaction-search.ts',
    'app/providers/wallet/use-logged-wallet-error.ts',
    'app/providers/wallet/use-wallet.ts',
    'app/shared/lib/use-auto-refresh.ts',
    'app/shared/lib/use-breakpoint.ts',
    'app/shared/lib/use-can-native-share.ts',
    'app/shared/lib/use-hydrated.ts',
    'app/shared/lib/use-reduced-motion.ts',
];

module.exports = {
    plugins: ['typescript', 'unicorn', 'import', 'nextjs', 'react', 'jsx-a11y', 'vitest'],
    jsPlugins: [
        'eslint-plugin-boundaries',
        'eslint-plugin-storybook',
        'eslint-plugin-testing-library',
        { name: 'explorer', specifier: './config/oxlint-plugin.mjs' },
    ],
    // Only rules listed below run; oxlint's default-on `correctness` category is not part of the ruleset.
    categories: { correctness: 'off' },
    env: { browser: true, builtin: true, node: true },
    options: { reportUnusedDisableDirectives: 'warn' },
    settings: {
        // FSD layered import boundaries — feature → entity + shared; entity → shared;
        // same-layer cross-slice imports prohibited; cross-entity public API via `@x`.
        // oxlint only reads settings from the root, so these sit here while the rule stays scoped to `app/**`.
        'boundaries/elements': [
            // Route handlers only. Pages are excluded on purpose: a server page may import a
            // client component to render it, which is the intended RSC pattern, while a handler
            // renders nothing and only ever calls what it imports.
            { type: 'route', pattern: 'app/**/route.[jt]s?(x)', mode: 'file' },
            { type: 'feature', pattern: 'app/features/*', mode: 'folder', capture: ['name'] },
            // Must precede the broader `entity` pattern — element types are matched in
            // declaration order, so `@x` folders would otherwise be classified as `entity`.
            {
                type: 'entity-public-api',
                pattern: 'app/entities/*/@x/*',
                mode: 'folder',
                capture: ['name', 'crossSlice'],
            },
            { type: 'entity', pattern: 'app/entities/*', mode: 'folder', capture: ['name'] },
            { type: 'shared', pattern: 'app/shared', mode: 'folder' },
        ],
        'import/resolver': {
            node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
            typescript: { alwaysTryTypes: true },
        },
    },
    ignorePatterns: [
        '**/dist/**',
        'packages/idl-decode/**',
        'lib/**',
        '.next/**',
        '.next-dev/**',
        'node_modules/**',
        '**/coverage/**',
        'playwright-report/**',
        'test-results/**',
        '.claude/**',
        '.worktrees/**',
        'packages/entity-inspector/**',
        'packages/parsers/**',
        'storybook-static/**',
        'storybook-static-*/**',
        'public/mockServiceWorker.js',
        'next-env.d.ts',
    ],
    rules: {
        // Next.js core web vitals
        'nextjs/google-font-display': 'warn',
        'nextjs/google-font-preconnect': 'warn',
        'nextjs/inline-script-id': 'error',
        'nextjs/next-script-for-ga': 'warn',
        'nextjs/no-assign-module-variable': 'error',
        'nextjs/no-async-client-component': 'warn',
        'nextjs/no-before-interactive-script-outside-document': 'warn',
        'nextjs/no-css-tags': 'warn',
        'nextjs/no-document-import-in-page': 'error',
        'nextjs/no-duplicate-head': 'error',
        'nextjs/no-head-element': 'warn',
        'nextjs/no-head-import-in-document': 'error',
        'nextjs/no-html-link-for-pages': 'error',
        'nextjs/no-img-element': 'warn',
        'nextjs/no-page-custom-font': 'warn',
        'nextjs/no-script-component-in-head': 'error',
        'nextjs/no-styled-jsx-in-document': 'warn',
        'nextjs/no-sync-scripts': 'error',
        'nextjs/no-title-in-document-head': 'warn',
        'nextjs/no-typos': 'warn',
        'nextjs/no-unwanted-polyfillio': 'warn',

        // React, React Hooks and JSX a11y (as bundled by eslint-config-next)
        'import/no-anonymous-default-export': 'warn',
        'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
        'jsx-a11y/aria-props': 'warn',
        'jsx-a11y/aria-proptypes': 'warn',
        'jsx-a11y/aria-unsupported-elements': 'warn',
        'jsx-a11y/role-has-required-aria-props': 'warn',
        'jsx-a11y/role-supports-aria-props': 'warn',
        'react/display-name': 'error',
        'react/exhaustive-deps': 'warn',
        'react/globals': 'error',
        'react/incompatible-library': 'warn',
        'react/jsx-key': 'error',
        'react/jsx-no-comment-textnodes': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/no-children-prop': 'error',
        'react/no-danger-with-children': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/require-render-return': 'error',
        'react/rules-of-hooks': 'error',
        'react/set-state-in-render': 'error',
        'react/unsupported-syntax': 'warn',
        'react/use-memo': 'error',

        // TODO: react-hooks rollout (introduced by the Next.js 16 upgrade). `eslint-config-next` v16
        // bundles `eslint-plugin-react-hooks` with the React Compiler-era rules below, which flag 225
        // pre-existing findings across the codebase. They stay off so the version bump stays green and
        // self-contained; re-enable and fix them incrementally (counts at time of upgrade):
        //   react/error-boundaries (143), react/refs (47), react/set-state-in-effect (26),
        //   react/purity (3), react/static-components (3),
        //   react/preserve-manual-memoization (2), react/immutability (1).
        'react/error-boundaries': 'off',
        'react/immutability': 'off',
        'react/preserve-manual-memoization': 'off',
        'react/purity': 'off',
        'react/refs': 'off',
        'react/set-state-in-effect': 'off',
        'react/static-components': 'off',

        // typescript-eslint recommended
        'no-array-constructor': 'error',
        'typescript/ban-ts-comment': 'error',
        'typescript/no-duplicate-enum-values': 'error',
        'typescript/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
        'typescript/no-extra-non-null-assertion': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-asserted-optional-chain': 'error',
        'typescript/no-require-imports': 'error',
        'typescript/no-this-alias': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/prefer-namespace-keyword': 'error',
        'typescript/triple-slash-reference': 'error',

        // Project rules
        'explorer/no-unlimited-disable': 'error',
        'explorer/no-restricted-syntax': ['error', ...NO_REGEXP_SELECTORS, CLIENT_MARKER_CONFLICT],
        'import/no-default-export': 'error',
        'no-console': 'error',
        'no-restricted-globals': ['error', 'RegExp'],
        'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
        'no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                caughtErrors: 'all',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
            },
        ],
        'prefer-template': 'error',
        'sort-keys': 'error',
        'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
        'typescript/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', prefer: 'type-imports' }],
        'typescript/no-explicit-any': 'error',
        'typescript/no-non-null-assertion': 'error',
        'unicorn/no-null': 'error',
    },
    overrides: [
        // typescript-eslint `eslint-recommended`: TypeScript already reports these, so they are replaced by
        // stricter style rules on TS files.
        {
            files: ['**/*.{ts,tsx,mts,cts}'],
            rules: {
                'no-var': 'error',
                'prefer-const': 'error',
                'prefer-rest-params': 'error',
                'prefer-spread': 'error',
            },
        },

        // Storybook story-lint rules
        {
            files: [`**/*.{stories,story}.{ts,tsx,js,jsx,mjs,cjs}`],
            rules: {
                'import/no-anonymous-default-export': 'off',
                'react/rules-of-hooks': 'off',
                'storybook/await-interactions': 'error',
                'storybook/context-in-play-function': 'error',
                'storybook/default-exports': 'error',
                'storybook/hierarchy-separator': 'warn',
                'storybook/no-redundant-story-name': 'warn',
                'storybook/no-renderer-packages': 'error',
                'storybook/prefer-pascal-case': 'warn',
                'storybook/story-exports': 'error',
                'storybook/use-storybook-expect': 'error',
                'storybook/use-storybook-testing-library': 'error',
            },
        },
        {
            files: ['.storybook/main.{js,cjs,mjs,ts}'],
            rules: {
                'storybook/no-uninstalled-addons': 'error',
            },
        },

        // Allow require() in CommonJS and script files
        {
            files: ['**/*.cjs', '**/*.js'],
            rules: {
                'typescript/no-require-imports': 'off',
            },
        },

        // `.cjs` files are CommonJS (module.exports), so `import/no-default-export` doesn't apply.
        {
            files: ['**/*.cjs'],
            rules: {
                'import/no-default-export': 'off',
            },
        },

        // Testing library config for test files
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'testing-library/await-async-events': ['error', { eventModule: 'userEvent' }],
                'testing-library/await-async-queries': 'error',
                'testing-library/await-async-utils': 'error',
                'testing-library/no-await-sync-events': ['error', { eventModules: ['fire-event'] }],
                'testing-library/no-await-sync-queries': 'error',
                'testing-library/no-container': 'error',
                'testing-library/no-debugging-utils': 'warn',
                'testing-library/no-dom-import': ['error', 'react'],
                'testing-library/no-global-regexp-flag-in-query': 'error',
                'testing-library/no-manual-cleanup': 'error',
                'testing-library/no-node-access': 'error',
                'testing-library/no-promise-in-fire-event': 'error',
                'testing-library/no-render-in-lifecycle': 'error',
                'testing-library/no-unnecessary-act': 'error',
                'testing-library/no-wait-for-multiple-assertions': 'error',
                'testing-library/no-wait-for-side-effects': 'error',
                'testing-library/no-wait-for-snapshot': 'error',
                'testing-library/prefer-find-by': 'error',
                'testing-library/prefer-presence-queries': 'error',
                'testing-library/prefer-query-by-disappearance': 'error',
                'testing-library/prefer-screen-queries': 'error',
                'testing-library/render-result-naming-convention': 'error',
            },
        },

        // Vitest: enforce `it()` / `test()` titles start with "should"
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'vitest/valid-title': [
                    'error',
                    {
                        // Allow `it.each` template titles like `'$scenario'` — the rule sees the literal
                        // template, not the resolved row value, so we accept any leading `$varname`.
                        mustMatch: { it: '^(should\\b|\\$)', test: '^(should\\b|\\$)' },
                    },
                ],
            },
        },

        // TODO: `vitest/valid-title` cleanup. Each test file below has at least one `it()`/`test()` title
        // that doesn't start with "should" and is temporarily exempted so CI can stay green during the
        // gradual rollout. Per-file (not per-directory) so any *new* test file in these areas is still
        // subject to the rule. Remove a path once its titles have been migrated.
        {
            files: [
                'app/entities/idl/model/converters/type-handlers/leaf-tuple-type-handler.spec.ts',
                'app/entities/idl/model/converters/type-handlers/tuple-type-handlers.spec.ts',
            ],
            rules: {
                'vitest/valid-title': 'off',
            },
        },

        // Allow `null` in tests and Storybook stories — they mirror the component APIs they exercise
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'unicorn/no-null': 'off',
            },
        },

        // Allow unlimited disable in mock files
        {
            files: [`**/mocks/**/*.${JS_TS}`],
            rules: {
                'explorer/no-unlimited-disable': 'off',
            },
        },

        // Allow console in logger, scripts, standalone files
        {
            files: [
                'app/shared/lib/logger.ts',
                'packages/entity-inspector/src/logger.ts',
                'scripts/**',
                '**/*.mjs',
                '**/*.cjs',
            ],
            rules: {
                'no-console': 'off',
            },
        },

        // Relax sort-keys in config/tooling files
        {
            files: [
                './*.config.*',
                '**/*.mjs',
                '**/*.cjs',
                '.storybook/**',
                'storybook-design/.storybook/**',
                'scripts/**',
            ],
            rules: {
                'sort-keys': 'off',
            },
        },

        // TODO: `import/no-default-export` cleanup. Each path below has a legacy default export that
        // should be migrated to a named export. Per-file (not per-directory) so any *new* file in
        // these areas is still subject to the rule. Remove a path once its export is renamed.
        {
            files: [
                // app/components (pre-FSD legacy)
                'app/components/account/token-extensions/ScaledUiAmountMultiplierTooltip.tsx',
                'app/components/instruction/AnchorDetailsCard.tsx',

                // app/providers (pre-FSD legacy)
                'app/providers/accounts/flagged-accounts.tsx',

                // app/utils (pre-FSD legacy)
                'app/utils/get-instruction-card-scroll-anchor-id.ts',
                'app/utils/get-readable-title-from-address.ts',
                'app/utils/use-tab-visibility.ts',

                // app/entities (FSD entities)
                'app/entities/nft/lib/get-edition-info.ts',
                'app/entities/nft/lib/is-metaplex-nft.ts',
                'app/entities/program-metadata/ui/program-name.tsx',

                // app/features (FSD features)
                'app/features/search/ui/SearchBar.tsx',
            ],
            rules: {
                'import/no-default-export': 'off',
            },
        },

        // Allow default exports where Next.js / Storybook / build tooling require them
        {
            files: [
                // Next.js App Router route files (server)
                'app/**/page.{ts,tsx,js,jsx}',
                'app/**/layout.{ts,tsx,js,jsx}',
                'app/**/error.{ts,tsx,js,jsx}',
                'app/**/loading.{ts,tsx,js,jsx}',
                'app/**/not-found.{ts,tsx,js,jsx}',
                'app/**/template.{ts,tsx,js,jsx}',
                'app/**/default.{ts,tsx,js,jsx}', // parallel-route default slot
                'app/**/global-error.{ts,tsx,js,jsx}',
                'app/**/forbidden.{ts,tsx,js,jsx}',
                'app/**/unauthorized.{ts,tsx,js,jsx}',

                // Project convention for the matching client component used by `page.tsx`
                'app/**/page-client.{ts,tsx}',

                // Next.js root files
                './next.config.*',
                './empty.ts', // Turbopack `resolveAlias` stub for Node built-ins (see next.config.mjs)
                './instrumentation.ts',
                './instrumentation-client.ts',
                './proxy.ts',
                './sentry.*.config.ts',

                // Storybook
                '.storybook/**',
                'storybook-design/.storybook/**',
                `**/*.stories.${JS_TS}`,

                // Generic config files (including nested ones, e.g. packages/*/vitest.config.ts)
                '**/*.config.{ts,mts,js,mjs,cjs}',

                // Loaded by oxlint as a JS plugin, which must default-export the plugin object
                'config/oxlint-plugin.mjs',
            ],
            rules: {
                'import/no-default-export': 'off',
            },
        },

        {
            files: [`app/**/*.${JS_TS}`],
            rules: {
                'boundaries/dependencies': [
                    'error',
                    {
                        default: 'disallow',
                        rules: [
                            {
                                // Only through `server.ts` — that barrel exists to declare what a slice
                                // offers the server. `index.ts` is server-safe only by accident: add one
                                // client export to it later and a client boundary lands on a server call
                                // path silently. A deep path into `api/` or `lib/` drags in whatever that
                                // module happens to import, with the same result.
                                from: { type: 'route' },
                                allow: {
                                    to: [
                                        { type: 'shared' },
                                        { type: 'entity', internalPath: 'server.ts' },
                                        { type: 'feature', internalPath: 'server.ts' },
                                    ],
                                },
                            },
                            {
                                from: { type: 'feature' },
                                allow: {
                                    to: [
                                        { type: 'shared' },
                                        { type: 'entity', internalPath: 'index.ts' },
                                        // Hooks an entity keeps off `index.ts` so that barrel stays callable
                                        // from a route handler; the `client-only` marker on it catches misuse.
                                        { type: 'entity', internalPath: 'client.ts' },
                                        // `server.ts` is an entity's server-only public API - the split AGENTS.md
                                        // mandates for server code in a slice - so it is as much a barrel as
                                        // `index.ts`. Needed because some entity exports must never reach a client
                                        // bundle: `@entities/idl/server` pulls in `@solana/idl` (~40 KB gzip).
                                        { type: 'entity', internalPath: 'server.ts' },
                                        { type: 'entity-public-api' },
                                        { type: 'feature', captured: { name: '{{ name }}' } },
                                    ],
                                },
                            },
                            {
                                from: { type: 'entity' },
                                allow: {
                                    to: [
                                        { type: 'shared' },
                                        { type: 'entity-public-api' },
                                        { type: 'entity', captured: { name: '{{ name }}' } },
                                    ],
                                },
                            },
                            {
                                // `@x` re-export files reach back into their own entity's internals.
                                from: { type: 'entity-public-api' },
                                allow: {
                                    to: [{ type: 'shared' }, { type: 'entity', captured: { name: '{{ name }}' } }],
                                },
                            },
                            {
                                from: { type: 'shared' },
                                allow: {
                                    to: { type: 'shared' },
                                },
                            },
                        ],
                    },
                ],
            },
        },

        // Allow cross-boundary imports in tests and Storybook stories.
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'boundaries/dependencies': 'off',
            },
        },

        // A slice's data-access layer is shared by both graphs: route handlers call it on the server,
        // components call it in the browser. `'use client'` here compiles fine and then throws
        // "is on the client" the first time a server caller invokes it. Put the boundary on the hook or
        // component that consumes the module instead.
        {
            files: [
                `app/entities/*/api/**/*.${JS_TS}`,
                `app/entities/*/@x/**/*.${JS_TS}`,
                `app/features/*/api/**/*.${JS_TS}`,
            ],
            excludeFiles: TEST_AND_STORY_FILES,
            rules: {
                'explorer/no-restricted-syntax': [
                    'error',
                    ...NO_REGEXP_SELECTORS,
                    CLIENT_MARKER_CONFLICT,
                    {
                        selector: "ExpressionStatement > Literal[value='use client']",
                        message:
                            "Do not mark a slice's api/ or @x/ module 'use client' — server code imports it, and the directive turns those calls into a client-reference error at runtime. Move the boundary to the consuming hook or component.",
                    },
                ],
            },
        },

        // Deliberately its own rule: configuring `explorer/no-restricted-syntax` here would replace the
        // error-level selectors for these files and silently downgrade them.
        {
            files: [`app/**/use-*.${JS_TS}`],
            excludeFiles: [...TEST_AND_STORY_FILES, ...HOOKS_PENDING_CLIENT_ONLY],
            rules: {
                'explorer/prefer-client-only-in-hooks': 'error',
            },
        },

        // A `server.ts` barrel declares which exports are for server consumers; without the marker that
        // declaration is unenforced, and a client importer is only found at runtime. Universal code stays
        // reachable through the slice's `index.ts`.
        {
            files: [`app/**/server.${JS_TS}`],
            rules: {
                'explorer/no-restricted-syntax': [
                    'error',
                    ...NO_REGEXP_SELECTORS,
                    CLIENT_MARKER_CONFLICT,
                    {
                        selector: "Program:not(:has(ImportDeclaration[source.value='server-only']))",
                        message:
                            "A `server.ts` barrel must `import 'server-only'` so a client importer fails `next build` instead of at runtime.",
                    },
                ],
            },
        },

        // TODO: `boundaries/dependencies` cleanup. Each path below crosses an FSD boundary
        // (cross-feature, cross-entity without `@x`, reverse-layer, or deep import bypassing the
        // barrel). Per-file so any *new* file in these areas is still subject to the rule. Remove a
        // path once the import is migrated (route through the barrel, use `@x`, or relocate shared
        // logic to `shared/`).
        {
            files: [
                // app/entities cross-entity / wrong-direction imports
                'app/entities/nft/lib/get-metadata-json.ts',

                // app/features cross-feature imports
                'app/features/idl/interactive-idl/model/use-mainnet-confirmation.ts',
                'app/features/instruction-simulation/ui/SimulationCard.tsx',
                'app/features/receipt/receipt-page.tsx',
                'app/features/stake/ui/StakeAccountSection.tsx',
                'app/features/transaction/ui/AccountDetailDrawer.tsx',
                'app/features/transaction/ui/AccountExpandedSections.tsx',
                'app/features/transaction/ui/InstructionsSection.tsx',
                'app/features/transaction/ui/SummaryCard.tsx',
                'app/features/vote/ui/VoteAccountSection.tsx',

                // app/features deep imports into entities (must go via barrel)
                'app/features/idl/interactive-idl/model/codama/codama-interpreter.ts',

                // app/shared reverse-layer imports
                'app/shared/components/DownloadDropdown.tsx',
            ],
            rules: {
                'boundaries/dependencies': 'off',
            },
        },

        // - Restrict @sentry/nextjs imports in app code
        // - Disable Jest — this project uses Vitest
        {
            files: [`app/**/*.${JS_TS}`],
            excludeFiles: ['app/shared/lib/sentry/**', 'app/shared/lib/logger.ts'],
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
                            {
                                name: 'jest',
                                message: 'This project uses Vitest. Import from `vitest` instead.',
                            },
                        ],
                        patterns: [
                            {
                                group: ['@jest/*'],
                                message: 'This project uses Vitest. Import from `vitest` instead.',
                            },
                        ],
                    },
                ],
            },
        },

        // `scripts/**` runs as a plain Node process, where a slice's `server.ts` / `client.ts` barrel is
        // the wrong door: the `server-only` / `client-only` marker on it resolves to its throwing
        // `default` export outside Next's build, so the script dies on import. No green gate catches it —
        // vite aliases both markers to a stub, so the specs pass and the cron is where it surfaces.
        {
            files: [`scripts/**/*.${JS_TS}`],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: [
                                    '**/app/**/server',
                                    '**/app/**/server.ts',
                                    '**/app/**/client',
                                    '**/app/**/client.ts',
                                ],
                                message:
                                    "A slice's `server.ts`/`client.ts` barrel carries a `server-only`/`client-only` marker that throws outside Next's build. Import the module that owns the export instead.",
                            },
                        ],
                    },
                ],
            },
        },

        // Allow type assertions in tests, mocks, fixtures, and Storybook stories — they routinely fake
        // partial shapes to exercise component/module surfaces and shouldn't be held to the production
        // typecast prohibition.
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'typescript/consistent-type-assertions': 'off',
            },
        },

        // Allow type-import flexibility in tests, mocks, fixtures, and Storybook stories — they often
        // use dynamic mock shapes and shouldn't be forced into static `import type` form.
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'typescript/consistent-type-imports': 'off',
            },
        },

        // TODO: `typescript/consistent-type-imports` cleanup. Each app/<name>/** below has
        // existing imports missing the `type` keyword and is temporarily exempted so CI can stay green
        // during the gradual rollout. Run `oxlint --fix` per-directory to migrate and remove the entry.
        {
            files: [
                `app/address/**/*.${JS_TS}`,
                `app/api/**/*.${JS_TS}`,
                `app/block/**/*.${JS_TS}`,
                `app/components/**/*.${JS_TS}`,
                `app/entities/**/*.${JS_TS}`,
                `app/epoch/**/*.${JS_TS}`,
                `app/feature-gates/**/*.${JS_TS}`,
                `app/features/**/*.${JS_TS}`,
                `app/og/**/*.${JS_TS}`,
                `app/providers/**/*.${JS_TS}`,
                `app/shared/**/*.${JS_TS}`,
                `app/tos/**/*.${JS_TS}`,
                `app/tx/**/*.${JS_TS}`,
                `app/utils/**/*.${JS_TS}`,
                `app/validators/**/*.${JS_TS}`,
            ],
            rules: {
                'typescript/consistent-type-imports': 'off',
            },
        },

        // TODO: `typescript/consistent-type-assertions` cleanup. Each app/<name>/** below has
        // existing `as X` casts and is temporarily exempted so CI can stay green during the gradual
        // rollout. Per-directory (not per-file) for now; tighten to per-file or remove a path once its
        // casts have been migrated (or justified with an inline disable + comment).
        {
            files: [
                `app/address/**/*.${JS_TS}`,
                `app/api/**/*.${JS_TS}`,
                `app/components/**/*.${JS_TS}`,
                `app/entities/**/*.${JS_TS}`,
                `app/feature-gates/**/*.${JS_TS}`,
                `app/features/**/*.${JS_TS}`,
                `app/providers/**/*.${JS_TS}`,
                `app/shared/**/*.${JS_TS}`,
                `app/tx/**/*.${JS_TS}`,
                `app/utils/**/*.${JS_TS}`,
            ],
            rules: {
                'typescript/consistent-type-assertions': 'off',
            },
        },

        // TODO: `unicorn/no-null` cleanup. Each path below has at least one `null` literal flagged by
        // the rule and is temporarily exempted so CI can stay green during the gradual rollout. The list
        // is intentionally per-file (not per-directory) so any *new* file in these areas is still
        // subject to the rule. Remove a path from the list once its `null` usages have been migrated
        // to `undefined` (or justified with an inline `eslint-disable-next-line unicorn/no-null`).
        {
            files: [
                // app root & route pages (pre-FSD)
                'app/layout.tsx',
                'app/address/[[]address[]]/layout.tsx',
                'app/block/[[]slot[]]/accounts/page-client.tsx',
                'app/block/[[]slot[]]/page-client.tsx',
                'app/block/[[]slot[]]/programs/page-client.tsx',
                'app/block/[[]slot[]]/rewards/page-client.tsx',
                'app/tx/[[]signature[]]/page-client.tsx',

                // app/api (Next route handlers)
                'app/api/domain-info/[[]domain[]]/route.ts',
                'app/api/metadata/proxy/route.ts',
                'app/api/token-price/[[]mintAddress[]]/route.ts',
                'app/api/search/route.ts',

                // app/components (pre-FSD legacy — to be migrated into features/entities)
                'app/components/LiveTransactionStatsCard.tsx',
                'app/components/MessageBanner.tsx',
                'app/components/account/AnchorAccountCard.tsx',
                'app/components/account/CompressedNftCard.tsx',
                'app/components/account/FeatureAccountSection.tsx',
                'app/components/account/MetaplexNFTHeader.tsx',
                'app/components/account/OwnedTokensCard.tsx',
                'app/components/account/ProgramMultisigCard.tsx',
                'app/components/account/RewardsCard.tsx',
                'app/components/account/TokenAccountSection.tsx',
                'app/components/account/TokenExtensionsSection.tsx',
                'app/components/account/TokenHistoryCard.tsx',
                'app/components/account/UpgradeableLoaderAccountSection.tsx',
                'app/components/account/VerifiedBuildCard.tsx',
                'app/components/account/history/TokenInstructionsCard.tsx',
                'app/components/account/history/TokenTransfersCard.tsx',
                'app/components/account/nftoken/isNFTokenAccount.ts',
                'app/components/account/nftoken/nftoken.ts',
                'app/components/account/sas/AttestationDataCard.tsx',
                'app/components/account/sas/SolanaAttestationCard.tsx',
                'app/components/account/token-extensions/ScaledUiAmountMultiplierTooltip.tsx',
                'app/components/block/BlockHistoryCard.tsx',
                'app/components/block/BlockRewardsCard.tsx',
                'app/components/common/BaseInstructionCard.tsx',
                'app/components/common/BaseRawParsedDetails.tsx',
                'app/components/common/Copyable.tsx',
                'app/components/common/InfoTooltip.tsx',
                'app/components/common/InspectorInstructionCard.tsx',
                'app/components/common/NFTArt.tsx',
                'app/components/common/TableCardBody.tsx',
                'app/components/common/TimestampToggle.tsx',
                'app/components/inspector/AccountsCard.tsx',
                'app/components/inspector/AddressTableLookupsCard.tsx',
                'app/components/inspector/AddressWithContext.tsx',
                'app/components/inspector/InstructionsSection.tsx',
                'app/components/instruction/AnchorDetailsCard.tsx',
                'app/components/instruction/ProgramEventsCard.tsx',
                'app/components/instruction/codama/CodamaInstructionDetailsCard.tsx',
                'app/components/instruction/codama/codamaUtils.tsx',
                'app/components/instruction/program-metadata-idl/ProgramMetadataIdlInstructionDetailsCard.tsx',
                'app/components/instruction/token/TokenDetailsCard.tsx',
                'app/components/shared/StatusBadge.tsx',
                'app/components/shared/account/ProgramHeader.tsx',
                'app/components/shared/ui/autocomplete.tsx',

                // app/providers (pre-FSD legacy)
                'app/providers/accounts/rewards.tsx',
                'app/providers/compressed-nft.tsx',
                'app/providers/epoch.tsx',
                'app/providers/squadsMultisig.tsx',
                'app/providers/stats/solanaClusterStats.tsx',
                'app/providers/stats/solanaPerformanceInfo.tsx',
                'app/providers/transactions/index.tsx',
                'app/providers/transactions/raw.tsx',

                // app/utils (pre-FSD legacy)
                'app/utils/anchor.tsx',
                'app/utils/attestation-service.tsx',
                'app/utils/cluster.ts',
                'app/utils/get-readable-title-from-address.ts',
                'app/utils/parseFeatureAccount.ts',
                'app/utils/program-logs.ts',
                'app/utils/program-verification.tsx',
                'app/utils/verified-builds.tsx',

                // app/shared (FSD shared)
                'app/shared/lib/triggerDownload.ts',
                'app/shared/lib/visibility.tsx',
                'app/shared/ui/navigation-tabs/ui/NavigationTabLink.tsx',

                // app/entities (FSD entities)
                'app/entities/account/model/use-accounts-info.ts',
                'app/entities/compute-unit/lib/compute-units-schedule.ts',
                'app/entities/digital-asset/api.ts',
                'app/entities/domain/api/fetch-ans-domains.ts',
                'app/entities/domain/api/resolve-domain.ts',
                'app/entities/domain/model/use-user-ans-domains.ts',
                'app/entities/domain/model/use-user-sns-domains.ts',
                'app/entities/domain/ui/BaseDomainsCard.tsx',
                'app/entities/idl/model/anchor/use-anchor-program.ts',
                'app/entities/idl/model/anchor/use-format-anchor-idl.ts',
                'app/entities/idl/model/converters/type-handlers/tuple-type-handlers.ts',
                'app/entities/idl/model/idl-version.ts',
                'app/entities/idl/model/use-format-codama-idl.ts',
                'app/entities/nft/lib/is-metaplex-nft.ts',
                'app/entities/token-info/model/token-info-batch-provider.tsx',
                'app/entities/token-info/model/use-token-info.ts',
                'app/entities/token-price/lib/parse-usd.ts',
                'app/entities/token-price/model/use-token-price.ts',

                // app/features (FSD features)
                'app/features/account/ui/AccountDownloadDropdown.tsx',
                'app/features/cookie/lib/cookie.ts',
                'app/features/cookie/model/use-analytics-consent.ts',
                'app/features/cookie/ui/CookieConsent.tsx',
                'app/features/idl/formatted-idl/model/search.ts',
                'app/features/idl/formatted-idl/ui/BaseFormattedIdl.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlAccounts.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlConstants.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlDoc.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlErrors.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlEvents.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlFields.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlInstructions.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlPdas.tsx',
                'app/features/idl/formatted-idl/ui/BaseIdlTypes.tsx',
                'app/features/idl/formatted-idl/ui/SearchHighlightContext.tsx',
                'app/features/idl/interactive-idl/model/anchor/anchor-interpreter.ts',
                'app/features/idl/interactive-idl/model/codama/codama-interpreter.ts',
                'app/features/idl/interactive-idl/model/codama/codama-program.ts',
                'app/features/idl/interactive-idl/model/codama/convert-value.ts',
                'app/features/idl/interactive-idl/model/idl-executor.ts',
                'app/features/idl/interactive-idl/model/pda-generator/anchor-provider.ts',
                'app/features/idl/interactive-idl/model/pda-generator/codama-provider.ts',
                'app/features/idl/interactive-idl/model/pda-generator/program-resolver.ts',
                'app/features/idl/interactive-idl/model/pda-generator/registry.ts',
                'app/features/idl/interactive-idl/model/pda-generator/seed-builder.ts',
                'app/features/idl/interactive-idl/model/state-atoms.ts',
                'app/features/idl/interactive-idl/model/use-mainnet-confirmation.ts',
                'app/features/idl/interactive-idl/ui/ArgumentInput.tsx',
                'app/features/idl/interactive-idl/ui/BaseConnectWalletButton.tsx',
                'app/features/idl/interactive-idl/ui/InteractWithIdl.tsx',
                'app/features/idl/ui/IdlRenderer.tsx',
                'app/features/idl/ui/IdlSection.tsx',
                'app/features/metadata/mocks.ts',
                'app/features/metadata/model/useOffChainMetadata.ts',
                'app/features/mpl-token-metadata/ui/MetaplexTokenMetadataDetailsCard.tsx',
                'app/features/nicknames/lib/nicknames.ts',
                'app/features/nicknames/model/use-nickname.ts',
                'app/features/receipt/__e2e__/receipt.e2e.ts',
                'app/features/receipt/lib/generate-receipt-csv.ts',
                'app/features/receipt/lib/use-primary-domain.ts',
                'app/features/receipt/mocks/custom-fee-payer.ts',
                'app/features/receipt/mocks/jito-only-transfer.ts',
                'app/features/receipt/mocks/mixed-mint-transfers.ts',
                'app/features/receipt/mocks/multiple-transfers.ts',
                'app/features/receipt/mocks/no-transfers.ts',
                'app/features/receipt/mocks/single-transfer.ts',
                'app/features/receipt/mocks/token-2022-transfer.ts',
                'app/features/receipt/mocks/token-2022-transfer2.ts',
                'app/features/receipt/mocks/usdc-checked-transfer.ts',
                'app/features/receipt/mocks/usdc-fp-precision-transfers.ts',
                'app/features/receipt/mocks/usdc-jito-transfer.ts',
                'app/features/receipt/mocks/usdc-multiple-transfers.ts',
                'app/features/receipt/mocks/usdc-multisig-transfer.ts',
                'app/features/receipt/mocks/usdc-regular-transfer.ts',
                'app/features/receipt/mocks/zero-transfer.ts',
                'app/features/receipt/receipt-page.tsx',
                'app/features/receipt/ui/BaseReceiptImage.tsx',
                'app/features/receipt/ui/ViewReceiptButton.tsx',
                'app/features/search/lib/filter-tabs.ts',
                'app/features/search/model/use-search.ts',
                'app/features/search/ui/BaseSearch.tsx',
                'app/features/security-txt/ui/SecurityCard.tsx',
                'app/features/security-txt/ui/SecurityNotification.tsx',
                'app/features/security-txt/ui/common.tsx',
                'app/features/security-txt/ui/utils.ts',
                'app/features/stake/lib/stake-activation-math.ts',
                'app/features/stake/ui/StakeAccountSection.tsx',
                'app/features/token-verification-badge/model/use-jupiter.ts',
                'app/features/token-verification-badge/model/use-rugcheck.ts',
                'app/features/token-verification-badge/ui/VerificationIcon.tsx',
                'app/features/transaction-history/ui/TransactionHistoryCard.tsx',
                'app/features/transaction/ui/AccountsCard.tsx',
                'app/features/transaction/ui/ProgramLogSection.tsx',
                'app/features/transaction/ui/TokenBalancesCard.tsx',
            ],
            rules: {
                'unicorn/no-null': 'off',
            },
        },

        // Allow `any` in tests, mocks, fixtures, and Storybook stories — they routinely fake partial
        // shapes to exercise component/module surfaces and shouldn't be held to the production
        // no-explicit-any prohibition.
        {
            files: TEST_AND_STORY_FILES,
            rules: {
                'typescript/no-explicit-any': 'off',
            },
        },

        // TODO: `typescript/no-explicit-any` cleanup. Each path below has at least one `any`
        // type annotation flagged by the rule and is temporarily exempted so CI can stay green during
        // the gradual rollout. The list is intentionally per-file (not per-directory) so any *new* file
        // in these areas is still subject to the rule. Remove a path from the list once its `any`
        // usages have been replaced with `unknown` (and narrowed) or a proper type.
        {
            files: [
                // app/components (pre-FSD legacy)
                'app/components/ProgramLogsCardBody.tsx',
                'app/components/account/AccountHeader.tsx',
                'app/components/account/AnchorAccountCard.tsx',
                'app/components/account/MetaplexNFTAttributesCard.tsx',
                'app/components/account/nftoken/nftoken-hooks.tsx',
                'app/components/account/nftoken/nftoken-types.ts',
                'app/components/account/sas/AttestationDataCard.tsx',
                'app/components/common/BaseInstructionCard.tsx',
                'app/components/common/InspectorInstructionCard.tsx',
                'app/components/inspector/InstructionsSection.tsx',
                'app/components/instruction/AnchorDetailsCard.tsx',
                'app/components/instruction/ProgramEventsCard.tsx',
                'app/components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard.tsx',
                'app/components/instruction/codama/codamaUtils.tsx',
                'app/components/instruction/program-metadata-idl/ProgramMetadataIdlInstructionDetailsCard.tsx',
                'app/components/instruction/token/TokenDetailsCard.tsx',

                // app/providers (pre-FSD legacy)
                'app/providers/accounts/index.tsx',
                'app/providers/squadsMultisig.tsx',

                // app/utils (pre-FSD legacy)
                'app/utils/anchor.tsx',
                'app/utils/attestation-service.tsx',
                'app/utils/program-err.ts',
                'app/utils/tx.ts',
                'app/utils/verified-builds.tsx',

                // app/entities (FSD entities)
                'app/entities/idl/lib/utils.ts',
                'app/entities/idl/model/anchor/use-format-anchor-idl.ts',
                'app/entities/idl/model/converters/convert-display-idl.ts',
                'app/entities/idl/model/converters/convert-legacy-idl.ts',
                'app/entities/idl/model/converters/type-handlers/leaf-tuple-type-handler.ts',
                'app/entities/idl/model/formatters/format.ts',
                'app/entities/idl/model/formatters/formatted-idl.d.ts',
                'app/entities/nft/lib/get-metadata-json.ts',

                // app/features (FSD features)
                'app/features/idl/interactive-idl/model/anchor/anchor-interpreter.ts',
                'app/features/idl/interactive-idl/model/anchor/anchor-program.ts',
                'app/features/idl/interactive-idl/model/anchor/array-parser.ts',
                'app/features/idl/interactive-idl/model/unified-program.d.ts',
                'app/features/security-txt/ui/PmpSecurityTxtTable.tsx',
                'app/features/security-txt/ui/SecurityCard.tsx',
                'app/features/security-txt/ui/common.tsx',
            ],
            rules: {
                'typescript/no-explicit-any': 'off',
            },
        },

        // A vi.mock factory in the specs setup file must be self-contained: it runs while `@solana/kit` is
        // still resolving, so dynamically importing app code from inside one makes the factory wait on a
        // module that is waiting on the factory, and the whole specs project deadlocks with no error and no
        // timeout. Static imports are fine — they finish before any factory runs.
        {
            files: ['./test-setup.specs.ts'],
            rules: {
                'explorer/no-restricted-syntax': [
                    'error',
                    ...NO_REGEXP_SELECTORS,
                    CLIENT_MARKER_CONFLICT,
                    {
                        selector: 'ImportExpression',
                        message:
                            'Do not use dynamic import() in this file. A vi.mock factory that imports app code deadlocks the specs project with no error and no timeout. Import statically at the top of the file instead.',
                    },
                ],
            },
        },
    ],
} satisfies OxlintConfig;
