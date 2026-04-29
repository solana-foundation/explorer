import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import type { Account } from '@providers/accounts';
import { RawDataField } from '@shared/RawDataField';

export type BaseRawAccountRowsProps = {
    account: Account;
    rawData?: Uint8Array;
    isLoading: boolean;
};

export function BaseRawAccountRows({ account, rawData, isLoading }: BaseRawAccountRowsProps) {
    return (
        <>
            <tr>
                <td>Address</td>
                <td className="text-lg-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Balance (SOL)</td>
                <td className="text-lg-end">
                    <SolBalance lamports={account.lamports} />
                </td>
            </tr>
            <tr>
                <td>Assigned Program Id</td>
                <td className="text-lg-end">
                    <Address pubkey={account.owner} alignRight link />
                </td>
            </tr>
            {account.space !== undefined && (
                <tr>
                    <td>Allocated Data Size</td>
                    <td className="text-lg-end">{account.space} byte(s)</td>
                </tr>
            )}
            <tr>
                <td>Executable</td>
                <td className="text-lg-end">{account.executable ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
                <td>Raw Data</td>
                <td>
                    <div className="e-flex e-justify-start md:e-justify-end">
                        <RawDataField data={rawData} filename={account.pubkey.toBase58()} loading={isLoading} />
                    </div>
                </td>
            </tr>
        </>
    );
}
