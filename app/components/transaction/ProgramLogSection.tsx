import { TableCardBody } from '@components/common/TableCardBody';
import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { cn } from '@shared/utils';
import { SignatureProps } from '@utils/index';
import { parseProgramLogs } from '@utils/program-logs';
import React from 'react';
import { Code } from 'react-feather';

import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function ProgramLogSection({ signature }: SignatureProps) {
    const [showRaw, setShowRaw] = React.useState(false);
    const { cluster, url } = useCluster();
    const details = useTransactionDetails(signature);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    if (!transactionWithMeta) return null;
    const message = transactionWithMeta.transaction.message;

    const logMessages = transactionWithMeta.meta?.logMessages || null;
    const err = transactionWithMeta.meta?.err || null;

    let prettyLogs = null;
    if (logMessages !== null) {
        prettyLogs = parseProgramLogs(logMessages, err, cluster);
    }

    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit" className={!showRaw ? '!e-border-b-0' : undefined}>
                    <CardTitle as="h3" ui="dashkit">
                        Program Instruction Logs
                    </CardTitle>
                    <button
                        className={cn('btn btn-sm e-flex e-items-center', showRaw ? 'btn-black active' : 'btn-white')}
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code className="e-mr-1.5" size={13} /> Raw
                    </button>
                </CardHeader>
                {prettyLogs !== null && logMessages !== null ? (
                    showRaw ? (
                        <RawProgramLogs raw={logMessages} />
                    ) : (
                        <ProgramLogsCardBody message={message} logs={prettyLogs} cluster={cluster} url={url} />
                    )
                ) : (
                    <CardBody ui="dashkit">Logs not supported for this transaction</CardBody>
                )}
            </Card>
        </>
    );
}

const RawProgramLogs = ({ raw }: { raw: string[] }) => {
    return (
        <TableCardBody>
            <tr>
                <td>
                    <pre className="e-text-left">{JSON.stringify(raw, null, 2)}</pre>
                </td>
            </tr>
        </TableCardBody>
    );
};
