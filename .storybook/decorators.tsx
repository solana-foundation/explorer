import { ClusterProvider } from '@providers/cluster';
import type { Decorator, Parameters } from '@storybook/react';
import React from 'react';

import { MockAccountsProvider } from './__mocks__/MockAccountsProvider';

/** Wraps stories with ClusterProvider. Usage: `decorators: [withCluster]` */
export const withCluster: Decorator = Story => (
    <ClusterProvider>
        <Story />
    </ClusterProvider>
);

/** Wraps stories with ClusterProvider and MockAccountsProvider. Usage: `decorators: [withClusterAndAccounts]` */
export const withClusterAndAccounts: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <Story />
        </MockAccountsProvider>
    </ClusterProvider>
);

/** Decorator for card table field components. Usage: `decorators: [withCardTableField]` */
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

/** Creates parameters for components using Next.js navigation */
export const createNextjsParameters = (options?: NextjsNavigationOptions): Parameters => ({
    nextjs: {
        appDirectory: true,
        navigation: {
            pathname: options?.pathname ?? '/',
            query: options?.query ?? {},
        },
    },
});

export const nextjsParameters: Parameters = createNextjsParameters();
