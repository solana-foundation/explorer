import { TableCardBody } from '@components/common/TableCardBody';
import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { cn } from '@components/shared/utils';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { SignatureProps } from '@utils/index';
import { parseProgramLogs } from '@utils/program-logs';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };
export function Chip({ children, className, active, ...props }: ChipProps) {
    return (
        <Button
            variant={active ? 'default' : 'outline'}
            size="sm"
            className={cn(active && '!e-border-accent', className)}
            {...props}
        >
            {children}
        </Button>
    );
}


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
        <section className="e-flex e-flex-col e-gap-3">
            <div className="e-flex e-justify-between">
                <h2 className="e-m-0 e-text-lg e-font-normal e-text-white">Logs</h2>
                <div className="e-flex e-shrink-0 e-gap-1">
                    <Chip active={!showRaw} onClick={() => setShowRaw(false)}>
                        Parsed
                    </Chip>
                    <Chip active={showRaw} onClick={() => setShowRaw(true)}>
                        RAW
                    </Chip>
                </div>
            </div>
            <div className="e-card">
                {prettyLogs !== null && logMessages !== null ? (
                    showRaw ? (
                        <RawProgramLogs raw={logMessages} />
                    ) : (
                        <ProgramLogsCardBody message={message} logs={prettyLogs} cluster={cluster} url={url} />
                    )
                ) : (
                    <div className="e-px-4 e-py-3 e-text-sm e-text-muted">Logs not supported for this transaction</div>
                )}
            </div>
        </section>
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
