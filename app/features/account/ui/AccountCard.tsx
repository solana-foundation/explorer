import { TableCardBodyProps } from '@components/common/TableCardBody';
import { useRawAccountDataOnMount } from '@entities/account';
import type { Account } from '@providers/accounts';

import { AccountCardBase, BaseRawAccountRows } from './AccountCardBase';

type AccountCardProps = TableCardBodyProps & {
    title: React.ReactNode;
    account: Account;
    refresh?: () => void;
    showRawButton?: boolean;
};

export function AccountCard({ account, children, ...rest }: AccountCardProps) {
    return (
        <AccountCardBase rawContent={<RawAccountRows account={account} />} {...rest}>
            {children}
        </AccountCardBase>
    );
}

function RawAccountRows({ account }: { account: Account }) {
    const rawData = useRawAccountDataOnMount(account.pubkey);

    return <BaseRawAccountRows account={account} rawData={rawData} />;
}
