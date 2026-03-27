import { Address } from '@components/common/Address';
import { HexData } from '@components/common/HexData';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import type { Account } from '@providers/accounts';
import React from 'react';
import { Code, RefreshCw } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';

export type AccountCardBaseProps = TableCardBodyProps & {
    title: React.ReactNode;
    rawContent?: React.ReactNode;
    refresh?: () => void;
    showRawButton?: boolean;
};

export function AccountCardBase({
    title,
    rawContent,
    refresh,
    showRawButton = true,
    children,
    ...tableProps
}: AccountCardBaseProps) {
    const [showRaw, setShowRaw] = React.useState(false);

    return (
        <div className="card">
            <div className="card-header e-gap-2">
                <h3 className="card-header-title mb-0 d-flex align-items-center">{title}</h3>
                {showRawButton && (
                    <Button
                        variant={showRaw ? 'default' : 'outline'}
                        size="sm"
                        aria-label="Raw"
                        className={showRaw ? 'e-shadow-active-sm' : undefined}
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code size={12} />
                        <span className="d-none d-md-inline">Raw</span>
                    </Button>
                )}
                {refresh && (
                    <Button variant="outline" size="sm" aria-label="Refresh" onClick={refresh}>
                        <RefreshCw size={12} />
                        <span className="d-none d-md-inline">Refresh</span>
                    </Button>
                )}
            </div>

            <TableCardBody {...tableProps}>{showRaw ? rawContent : children}</TableCardBody>
        </div>
    );
}

export type BaseRawAccountRowsProps = {
    account: Account;
    rawData?: Uint8Array | null;
};

export function BaseRawAccountRows({ account, rawData }: BaseRawAccountRowsProps) {
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
                    {rawData ? (
                        rawData.length > 0 ? (
                            <HexData raw={rawData} />
                        ) : (
                            <span>No data</span>
                        )
                    ) : (
                        <span className="spinner-grow spinner-grow-sm me-2" />
                    )}
                </td>
            </tr>
        </>
    );
}
