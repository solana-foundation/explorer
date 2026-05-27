import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import vitest from '@vitest/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import testingLibrary from 'eslint-plugin-testing-library';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

const TEST_AND_STORY_FILES = [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/__mocks__/**/*.[jt]s?(x)',
    '**/__fixtures__/**/*.[jt]s?(x)',
    '**/fixtures/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/*.stories.[jt]s?(x)',
];

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            'dist/**',
            'lib/**',
            '.next/**',
            '.next-dev/**',
            'node_modules/**',
            '.claude/**',
            '.worktrees/**',
            'next-env.d.ts',
        ],
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
            unicorn,
        },
        rules: {
            semi: ['error', 'always'],
            '@typescript-eslint/no-explicit-any': 'error',
            'object-curly-spacing': ['error', 'always'],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
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
            'prefer-template': 'error',
            'unicorn/no-null': 'error',
            'import/no-default-export': 'error',
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
        files: TEST_AND_STORY_FILES,
        ...testingLibrary.configs['flat/react'],
    },

    // Vitest: enforce `it()` / `test()` titles start with "should"
    {
        files: TEST_AND_STORY_FILES,
        plugins: { vitest },
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

    // TODO: `import/no-default-export` cleanup. Each path below has a legacy default export that
    // should be migrated to a named export. Per-file (not per-directory) so any *new* file in
    // these areas is still subject to the rule. Remove a path once its export is renamed.
    {
        files: [
            // app/components (pre-FSD legacy)
            'app/components/ClusterModalDeveloperSettings.tsx',
            'app/components/account/token-extensions/ScaledUiAmountMultiplierTooltip.tsx',
            'app/components/common/token-market-data/stories/MarketData.s.tsx',
            'app/components/common/token-market-data/stories/MarketDataSeries.s.tsx',
            'app/components/instruction/AnchorDetailsCard.tsx',
            'app/components/instruction/pyth/AddMappingDetailsCard.tsx',
            'app/components/instruction/pyth/AddPriceDetailsCard.tsx',
            'app/components/instruction/pyth/AddProductDetailsCard.tsx',
            'app/components/instruction/pyth/AggregatePriceDetailsCard.tsx',
            'app/components/instruction/pyth/BasePublisherOperationCard.tsx',
            'app/components/instruction/pyth/InitMappingDetailsCard.tsx',
            'app/components/instruction/pyth/InitPriceDetailsCard.tsx',
            'app/components/instruction/pyth/SetMinPublishersDetailsCard.tsx',
            'app/components/instruction/pyth/UpdatePriceDetailsCard.tsx',
            'app/components/instruction/pyth/UpdateProductDetailsCard.tsx',

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
            'next.config.*',
            'instrumentation.ts',
            'instrumentation-client.ts',
            'middleware.ts',
            'sentry.*.config.ts',

            // Storybook
            '.storybook/**',
            '**/*.stories.[jt]s?(x)',

            // Generic config files
            '*.config.{ts,mts,js,mjs,cjs}',
        ],
        rules: {
            'import/no-default-export': 'off',
        },
    },

    // FSD layered import boundaries — feature → entity + shared; entity → shared;
    // same-layer cross-slice imports prohibited; cross-entity public API via `@x`.
    {
        files: ['app/**/*.[jt]s?(x)'],
        plugins: { boundaries },
        settings: {
            'boundaries/elements': [
                { type: 'feature', pattern: 'app/features/*', mode: 'folder', capture: ['name'] },
                { type: 'entity', pattern: 'app/entities/*', mode: 'folder', capture: ['name'] },
                {
                    type: 'entity-public-api',
                    pattern: 'app/entities/*/@x/*',
                    mode: 'folder',
                    capture: ['name', 'crossSlice'],
                },
                { type: 'shared', pattern: 'app/shared', mode: 'folder' },
            ],
        },
        rules: {
            'boundaries/dependencies': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        {
                            from: { type: 'feature' },
                            allow: {
                                to: [
                                    { type: 'shared' },
                                    { type: 'entity', internalPath: 'index.ts' },
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

    // TODO: `boundaries/dependencies` cleanup. Each path below crosses an FSD boundary
    // (cross-feature, cross-entity without `@x`, reverse-layer, or deep import bypassing the
    // barrel). Per-file so any *new* file in these areas is still subject to the rule. Remove a
    // path once the import is migrated (route through the barrel, use `@x`, or relocate shared
    // logic to `shared/`).
    {
        files: [
            // app/entities cross-entity / wrong-direction imports
            'app/entities/nft/lib/get-metadata-json.ts',
            'app/entities/program-metadata/model/useProgramMetadataCodamaIdl.tsx',
            'app/entities/token-info/index.ts',
            'app/entities/token-info/lib/fetch-token-mints.ts',
            'app/entities/token-info/lib/is-valid-cluster.ts',

            // app/features cross-feature imports
            'app/features/idl/interactive-idl/model/__tests__/use-mainnet-confirmation.spec.ts',
            'app/features/idl/interactive-idl/model/use-mainnet-confirmation.ts',
            'app/features/receipt/receipt-page.tsx',
            'app/features/search/api/discover-with-utl.ts',
            'app/features/search/api/resolve-search-tokens.ts',
            'app/features/stake/ui/StakeAccountSection.tsx',

            // app/features deep imports into entities (must go via barrel)
            'app/features/idl/formatted-idl/model/__tests__/search.test.ts',
            'app/features/idl/formatted-idl/ui/stories/AnchorFormattedIdl.stories.tsx',
            'app/features/idl/formatted-idl/ui/stories/CodamaFormattedIdl.stories.tsx',
            'app/features/idl/interactive-idl/model/codama/codama-interpreter.ts',
            'app/features/idl/model/use-idl-last-transaction-date.tsx',

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

    // Allow type assertions in tests, mocks, fixtures, and Storybook stories — they routinely fake
    // partial shapes to exercise component/module surfaces and shouldn't be held to the production
    // typecast prohibition.
    {
        files: TEST_AND_STORY_FILES,
        rules: {
            '@typescript-eslint/consistent-type-assertions': 'off',
        },
    },

    // Allow type-import flexibility in tests, mocks, fixtures, and Storybook stories — they often
    // use dynamic mock shapes and shouldn't be forced into static `import type` form.
    {
        files: TEST_AND_STORY_FILES,
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },

    // TODO: `@typescript-eslint/consistent-type-imports` cleanup. Each app/<name>/** below has
    // existing imports missing the `type` keyword and is temporarily exempted so CI can stay green
    // during the gradual rollout. Run `eslint --fix` per-directory to migrate and remove the entry.
    {
        files: [
            'app/address/**/*.[jt]s?(x)',
            'app/api/**/*.[jt]s?(x)',
            'app/block/**/*.[jt]s?(x)',
            'app/components/**/*.[jt]s?(x)',
            'app/entities/**/*.[jt]s?(x)',
            'app/epoch/**/*.[jt]s?(x)',
            'app/feature-gates/**/*.[jt]s?(x)',
            'app/features/**/*.[jt]s?(x)',
            'app/og/**/*.[jt]s?(x)',
            'app/providers/**/*.[jt]s?(x)',
            'app/shared/**/*.[jt]s?(x)',
            'app/tos/**/*.[jt]s?(x)',
            'app/tx/**/*.[jt]s?(x)',
            'app/utils/**/*.[jt]s?(x)',
            'app/validators/**/*.[jt]s?(x)',
            'app/verified-programs/**/*.[jt]s?(x)',
        ],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },

    // TODO: `@typescript-eslint/consistent-type-assertions` cleanup. Each app/<name>/** below has
    // existing `as X` casts and is temporarily exempted so CI can stay green during the gradual
    // rollout. Per-directory (not per-file) for now; tighten to per-file or remove a path once its
    // casts have been migrated (or justified with an inline disable + comment).
    {
        files: [
            'app/address/**/*.[jt]s?(x)',
            'app/api/**/*.[jt]s?(x)',
            'app/components/**/*.[jt]s?(x)',
            'app/entities/**/*.[jt]s?(x)',
            'app/feature-gates/**/*.[jt]s?(x)',
            'app/features/**/*.[jt]s?(x)',
            'app/providers/**/*.[jt]s?(x)',
            'app/shared/**/*.[jt]s?(x)',
            'app/tx/**/*.[jt]s?(x)',
            'app/utils/**/*.[jt]s?(x)',
        ],
        rules: {
            '@typescript-eslint/consistent-type-assertions': 'off',
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
            'app/@analytics/default.js',
            'app/layout.tsx',
            'app/page.tsx',
            'app/address/[[]address[]]/layout.tsx',
            'app/block/[[]slot[]]/accounts/page-client.tsx',
            'app/block/[[]slot[]]/page-client.tsx',
            'app/block/[[]slot[]]/programs/page-client.tsx',
            'app/block/[[]slot[]]/rewards/page-client.tsx',
            'app/supply/page-client.tsx',
            'app/tx/[[]signature[]]/page-client.tsx',

            // app/api (Next route handlers)
            'app/api/anchor/route.ts',
            'app/api/domain-info/[[]domain[]]/route.ts',
            'app/api/metadata/proxy/route.ts',
            'app/api/program-metadata-idl/route.ts',
            'app/api/receipt/price/[[]mintAddress[]]/route.ts',
            'app/api/search/route.ts',

            // app/components (pre-FSD legacy — to be migrated into features/entities)
            'app/components/ClusterModal.tsx',
            'app/components/ClusterModalDeveloperSettings.tsx',
            'app/components/LiveTransactionStatsCard.tsx',
            'app/components/MessageBanner.tsx',
            'app/components/TopAccountsCard.tsx',
            'app/components/account/AnchorAccountCard.tsx',
            'app/components/account/CompressedNftCard.tsx',
            'app/components/account/FeatureAccountSection.tsx',
            'app/components/account/MetaplexNFTHeader.tsx',
            'app/components/account/OwnedTokensCard.tsx',
            'app/components/account/ProgramMultisigCard.tsx',
            'app/components/account/RewardsCard.tsx',
            'app/components/account/StakeAccountSection.tsx',
            'app/components/account/TokenAccountSection.tsx',
            'app/components/account/TokenExtensionsSection.tsx',
            'app/components/account/TokenHistoryCard.tsx',
            'app/components/account/UnknownAccountCard.tsx',
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
            'app/components/inspector/instruction-parsers/spl-token.parser.ts',
            'app/components/inspector/instruction-parsers/system-program.parser.ts',
            'app/components/inspector/instruction-parsers/token-2022-program.parser.ts',
            'app/components/instruction/AnchorDetailsCard.tsx',
            'app/components/instruction/ProgramEventsCard.tsx',
            'app/components/instruction/codama/CodamaInstructionDetailsCard.tsx',
            'app/components/instruction/codama/codamaUtils.tsx',
            'app/components/instruction/ed25519/Ed25519DetailsCard.tsx',
            'app/components/instruction/mango/ChangePerpMarketParamsDetailsCard.tsx',
            'app/components/instruction/mango/PlacePerpOrder2DetailsCard.tsx',
            'app/components/instruction/mango/PlacePerpOrderDetailsCard.tsx',
            'app/components/instruction/mango/PlaceSpotOrderDetailsCard.tsx',
            'app/components/instruction/program-metadata-idl/ProgramMetadataIdlInstructionDetailsCard.tsx',
            'app/components/instruction/pyth/UpdateProductDetailsCard.tsx',
            'app/components/instruction/token/TokenDetailsCard.tsx',
            'app/components/shared/StatusBadge.tsx',
            'app/components/shared/account/ProgramHeader.tsx',
            'app/components/shared/ui/autocomplete.tsx',
            'app/components/transaction/AccountsCard.tsx',
            'app/components/transaction/ProgramLogSection.tsx',
            'app/components/transaction/TokenBalancesCard.tsx',

            // app/providers (pre-FSD legacy)
            'app/providers/accounts/history.tsx',
            'app/providers/accounts/rewards.tsx',
            'app/providers/accounts/utils/stake.ts',
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
            'app/utils/feature-gate/UpcomingFeatures.tsx',
            'app/utils/get-readable-title-from-address.ts',
            'app/utils/parseFeatureAccount.ts',
            'app/utils/program-logs.ts',
            'app/utils/program-verification.tsx',
            'app/utils/verified-builds.tsx',

            // app/shared (FSD shared)
            'app/shared/lib/http-utils.ts',
            'app/shared/lib/triggerDownload.ts',
            'app/shared/lib/visibility.tsx',
            'app/shared/ui/navigation-tabs/ui/NavigationTabLink.tsx',

            // app/entities (FSD entities)
            'app/entities/account/model/use-accounts-info.ts',
            'app/entities/compute-unit/lib/compute-units-schedule.ts',
            'app/entities/compute-unit/ui/CUProfilingCard.tsx',
            'app/entities/digital-asset/api.ts',
            'app/entities/domain/api/fetch-ans-domains.ts',
            'app/entities/domain/api/resolve-domain.ts',
            'app/entities/domain/model/use-user-ans-domains.ts',
            'app/entities/domain/model/use-user-sns-domains.ts',
            'app/entities/domain/ui/BaseDomainsCard.tsx',
            'app/entities/idl/model/converters/type-handlers/tuple-type-handlers.ts',
            'app/entities/idl/model/idl-version.ts',
            'app/entities/idl/model/use-anchor-program.ts',
            'app/entities/idl/model/use-format-anchor-idl.ts',
            'app/entities/idl/model/use-format-codama-idl.ts',
            'app/entities/idl/model/use-idl-from-anchor-program-seed.ts',
            'app/entities/nft/lib/is-metaplex-nft.ts',
            'app/entities/program-metadata/api/getProgramCanonicalMetadata.ts',
            'app/entities/program-metadata/model/useProgramCanonicalMetadata.tsx',
            'app/entities/token-info/model/token-info-batch-provider.tsx',
            'app/entities/token-info/model/use-token-info.ts',

            // app/features (FSD features)
            'app/features/account/ui/AccountDownloadDropdown.tsx',
            'app/features/cookie/lib/cookie.ts',
            'app/features/cookie/model/use-analytics-consent.ts',
            'app/features/cookie/ui/CookieConsent.tsx',
            'app/features/cu-profiling/ui/CUProfilingSection.tsx',
            'app/features/custom-cluster/lib/cluster-storage.ts',
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
            'app/features/idl/interactive-idl/model/use-instruction.ts',
            'app/features/idl/interactive-idl/model/use-mainnet-confirmation.ts',
            'app/features/idl/interactive-idl/ui/ArgumentInput.tsx',
            'app/features/idl/interactive-idl/ui/BaseConnectWalletButton.tsx',
            'app/features/idl/interactive-idl/ui/InstructionActivity.tsx',
            'app/features/idl/interactive-idl/ui/InteractWithIdl.tsx',
            'app/features/idl/model/use-idl-last-transaction-date.tsx',
            'app/features/idl/ui/IdlRenderer.tsx',
            'app/features/idl/ui/IdlSection.tsx',
            'app/features/metadata/mocks.ts',
            'app/features/metadata/model/useOffChainMetadata.ts',
            'app/features/mpl-token-metadata/lib/metaplex-token-metadata.parser.ts',
            'app/features/mpl-token-metadata/ui/MetaplexTokenMetadataDetailsCard.tsx',
            'app/features/nicknames/lib/nicknames.ts',
            'app/features/nicknames/model/use-nickname.ts',
            'app/features/receipt/__e2e__/receipt.e2e.ts',
            'app/features/receipt/lib/generate-receipt-csv.ts',
            'app/features/receipt/lib/parse-usd.ts',
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
            'app/features/receipt/model/use-price.ts',
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
            'app/features/token-verification-badge/model/use-bluprynt.ts',
            'app/features/token-verification-badge/model/use-coingecko.ts',
            'app/features/token-verification-badge/model/use-jupiter.ts',
            'app/features/token-verification-badge/model/use-rugcheck.ts',
            'app/features/token-verification-badge/ui/VerificationIcon.tsx',
            'app/features/transaction-history/lib/use-instruction-names.ts',
            'app/features/transaction-history/ui/TransactionHistoryCard.tsx',
            'app/features/verified-programs/api.ts',
            'app/features/verified-programs/model.ts',
            'app/features/verified-programs/useVerifiedProgramsPagination.ts',
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
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    // TODO: `@typescript-eslint/no-explicit-any` cleanup. Each path below has at least one `any`
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
            'app/components/inspector/instruction-parsers/token-2022-program.parser.ts',
            'app/components/inspector/into-parsed-data.ts',
            'app/components/instruction/AnchorDetailsCard.tsx',
            'app/components/instruction/ProgramEventsCard.tsx',
            'app/components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard.tsx',
            'app/components/instruction/codama/codamaUtils.tsx',
            'app/components/instruction/lighthouse/LighthouseDetailsCard.tsx',
            'app/components/instruction/program-metadata-idl/ProgramMetadataIdlInstructionDetailsCard.tsx',
            'app/components/instruction/pyth/program.ts',
            'app/components/instruction/sas/SolanaAttestationDetailsCard.tsx',
            'app/components/instruction/token/TokenDetailsCard.tsx',
            'app/components/instruction/vote/VoteDetailsCard.tsx',

            // app/providers (pre-FSD legacy)
            'app/providers/accounts/index.tsx',
            'app/providers/accounts/utils/stake.ts',
            'app/providers/squadsMultisig.tsx',

            // app/utils (pre-FSD legacy)
            'app/utils/anchor.tsx',
            'app/utils/attestation-service.tsx',
            'app/utils/program-err.ts',
            'app/utils/tx.ts',
            'app/utils/verified-builds.tsx',

            // app/entities (FSD entities)
            'app/entities/idl/lib/utils.ts',
            'app/entities/idl/model/converters/convert-display-idl.ts',
            'app/entities/idl/model/converters/convert-legacy-idl.ts',
            'app/entities/idl/model/converters/type-handlers/leaf-tuple-type-handler.ts',
            'app/entities/idl/model/formatters/format.ts',
            'app/entities/idl/model/formatters/formatted-idl.d.ts',
            'app/entities/idl/model/use-format-anchor-idl.ts',
            'app/entities/nft/lib/get-metadata-json.ts',

            // app/features (FSD features)
            'app/features/idl/interactive-idl/model/anchor/anchor-interpreter.ts',
            'app/features/idl/interactive-idl/model/anchor/anchor-program.ts',
            'app/features/idl/interactive-idl/model/anchor/array-parser.ts',
            'app/features/idl/interactive-idl/model/unified-program.d.ts',
            'app/features/idl/interactive-idl/model/use-instruction.ts',
            'app/features/security-txt/ui/PmpSecurityTxtTable.tsx',
            'app/features/security-txt/ui/SecurityCard.tsx',
            'app/features/security-txt/ui/common.tsx',
        ],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
