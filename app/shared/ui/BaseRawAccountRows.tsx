import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { RawDataField } from '@components/shared/RawDataField';
import type { Account } from '@providers/accounts';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

export type BaseRawAccountRowsProps = {
    account: Account;
    rawData?: Uint8Array;
    isLoading: boolean;
};

export function BaseRawAccountRows({ account, rawData, isLoading }: BaseRawAccountRowsProps) {
    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Balance (SOL)', value: <SolBalance lamports={account.lamports} /> },
        { label: 'Assigned Program Id', value: <Address pubkey={account.owner} link /> },
        {
            label: 'Allocated Data Size',
            show: account.space !== undefined,
            value: account.space !== undefined && `${account.space} byte(s)`,
        },
        { label: 'Executable', value: account.executable ? 'Yes' : 'No' },
        {
            label: 'Raw Data',
            value: <RawDataField data={rawData} filename={account.pubkey.toBase58()} loading={isLoading} />,
        },
    ];

    return <KeyValueRows rows={rows} />;
}
