import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import type { Account } from '@providers/accounts';
import { RawDataField } from '@shared/RawDataField';

import { BaseTable } from '@/app/shared/ui/Table';

export type BaseRawAccountRowsProps = {
    account: Account;
    rawData?: Uint8Array;
    isLoading: boolean;
};

export function BaseRawAccountRows({ account, rawData, isLoading }: BaseRawAccountRowsProps) {
    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <SolBalance lamports={account.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Assigned Program Id</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={account.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {account.space !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Allocated Data Size</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">{account.space} byte(s)</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Executable</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{account.executable ? 'Yes' : 'No'}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Raw Data</BaseTable.Cell>
                <BaseTable.Cell>
                    <div className="e-flex e-justify-end">
                        <RawDataField data={rawData} filename={account.pubkey.toBase58()} loading={isLoading} />
                    </div>
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}
