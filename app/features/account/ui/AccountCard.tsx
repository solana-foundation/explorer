import { TableCardBodyProps } from '@components/common/TableCardBody';
import { useRawAccountDataOnMount } from '@entities/account';
import type { Account } from '@providers/accounts';

import { AccountDownloadDropdown } from './AccountDownloadDropdown';
import { BaseAccountCard } from './BaseAccountCard';
import { BaseRawAccountRows } from './BaseRawAccountRows';

type AccountCardProps = TableCardBodyProps & {
    title: React.ReactNode;
    account: Account;
    refresh?: () => void;
    showRawButton?: boolean;
    analyticsSection?: string;
};

export function AccountCard({ account, children, ...rest }: AccountCardProps) {
    return (
        <BaseAccountCard
            rawContent={<RawAccountRows account={account} />}
            headerActions={<AccountDownloadDropdown pubkey={account.pubkey} space={account.space} />}
            {...rest}
        >
            {children}
        </BaseAccountCard>
    );
}

function RawAccountRows({ account }: { account: Account }) {
    const { data, isLoading } = useRawAccountDataOnMount(account.pubkey);

    return <BaseRawAccountRows account={account} rawData={data} isLoading={isLoading} />;
}
