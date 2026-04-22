import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { AccountAnnotatedHex } from '@features/annotated-hex';
import type { Account } from '@providers/accounts';

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
                <td>Account Data (Hex)</td>
                <td className="text-lg-end">
                    {isLoading ? (
                        <span className="spinner-grow spinner-grow-sm me-2" />
                    ) : rawData ? (
                        rawData.length > 0 ? (
                            <AccountAnnotatedHex account={account} rawData={rawData} />
                        ) : (
                            <span>No data</span>
                        )
                    ) : (
                        <span>Account data unavailable</span>
                    )}
                </td>
            </tr>
        </>
    );
}
