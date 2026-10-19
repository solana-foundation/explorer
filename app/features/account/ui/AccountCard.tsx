import { RefreshButton } from '@components/shared/ui/refresh-button';
import { useAccountFetching, useRawAccountDataOnMount } from '@entities/account';
import type { Account } from '@providers/accounts';
import React from 'react';
import { Code } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { BaseRawAccountRows } from '@/app/shared/ui/BaseRawAccountRows';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { AccountDownloadDropdown } from './AccountDownloadDropdown';

type AccountCardProps = {
    title: React.ReactNode;
    account?: Account;
    refresh?: () => void;
    analyticsSection?: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
};

export function AccountCard({ account, title, refresh, analyticsSection, children, headerActions }: AccountCardProps) {
    const [showRaw, setShowRaw] = React.useState(false);
    const fetching = useAccountFetching(account?.pubkey.toBase58());

    const rawContent = account ? <RawAccountRows account={account} /> : undefined;

    return (
        <OverviewCard
            title={title}
            actions={
                <>
                    {headerActions}
                    {refresh && analyticsSection && (
                        <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
                    )}
                    {rawContent && (
                        <Button
                            variant={showRaw ? 'default' : 'outline'}
                            size="sm"
                            aria-label="Raw"
                            className={showRaw ? 'shadow-active-sm' : undefined}
                            onClick={() => setShowRaw(r => !r)}
                        >
                            <Code size={12} />
                            <span className="hidden md:inline">Raw</span>
                        </Button>
                    )}
                    {account && <AccountDownloadDropdown pubkey={account.pubkey} space={account.space} />}
                </>
            }
        >
            {showRaw ? rawContent : children}
        </OverviewCard>
    );
}

function RawAccountRows({ account }: { account: Account }) {
    const { data, isLoading } = useRawAccountDataOnMount(account.pubkey);

    return <BaseRawAccountRows account={account} rawData={data} isLoading={isLoading} />;
}
