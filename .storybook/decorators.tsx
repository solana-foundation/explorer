import { ClusterProvider } from '@providers/cluster';
import type { Decorator, Parameters } from '@storybook/react';
import React from 'react';

import { MockAccountsProvider } from './__mocks__/MockAccountsProvider';

/**
 * Decorator that wraps stories with ClusterProvider.
 *
 * Use this for components that depend on cluster context.
 *
 * @example
 * ```tsx
 * import { withCluster } from '../../../../../.storybook/decorators';
 *
 * const meta = {
 *     decorators: [withCluster],
 * };
 * ```
 */
export const withCluster: Decorator = Story => (
    <ClusterProvider>
        <Story />
    </ClusterProvider>
);

/**
 * Decorator that wraps stories with ClusterProvider and MockAccountsProvider.
 *
 * Use this for components that depend on both cluster and accounts context.
 *
 * @example
 * ```tsx
 * import { withClusterAndAccounts } from '../../../../../.storybook/decorators';
 *
 * const meta = {
 *     decorators: [withClusterAndAccounts],
 * };
 * ```
 */
export const withClusterAndAccounts: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <Story />
        </MockAccountsProvider>
    </ClusterProvider>
);

/**
 * Decorator for card table field components (like ProgramField).
 *
 * Wraps the story in a card with table structure and provides
 * ClusterProvider and MockAccountsProvider contexts.
 *
 * @example
 * ```tsx
 * import { withCardTableField, cardTableFieldParameters } from '../../../../../.storybook/decorators';
 *
 * const meta = {
 *     decorators: [withCardTableField],
 *     parameters: cardTableFieldParameters,
 * };
 * ```
 */
export const withCardTableField: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <div className="card">
                <div className="table-responsive mb-0">
                    <style>{`.card-table tbody tr:first-child td { border-top: none !important; }`}</style>
                    <table className="table table-sm table-nowrap card-table">
                        <tbody>
                            <Story />
                        </tbody>
                    </table>
                </div>
            </div>
        </MockAccountsProvider>
    </ClusterProvider>
);

type NextjsNavigationOptions = {
    pathname?: string;
    query?: Record<string, string>;
};

/**
 * Creates parameters for components using Next.js navigation.
 *
 * @example
 * ```tsx
 * // With defaults (pathname: '/', query: {})
 * parameters: createNextjsParameters(),
 *
 * // With custom pathname
 * parameters: createNextjsParameters({ pathname: '/tx/abc123' }),
 *
 * // With custom query
 * parameters: createNextjsParameters({ query: { cluster: 'devnet' } }),
 * ```
 */
export const createNextjsParameters = (options?: NextjsNavigationOptions): Parameters => ({
    nextjs: {
        appDirectory: true,
        navigation: {
            pathname: options?.pathname ?? '/',
            query: options?.query ?? {},
        },
    },
});

/**
 * Default parameters for components using Next.js navigation.
 */
export const nextjsParameters: Parameters = createNextjsParameters();
