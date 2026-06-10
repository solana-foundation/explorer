import { TableCardBody } from '@components/common/TableCardBody';
import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { cn } from '@components/shared/utils';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { SignatureProps } from '@utils/index';
import { parseProgramLogs } from '@utils/program-logs';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { BaseCardBody } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { CollapsibleSection } from './CollapsibleSection';

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

    const chips = (
        <>
            <Chip active={!showRaw} onClick={() => setShowRaw(false)}>
                Parsed
            </Chip>
            <Chip active={showRaw} onClick={() => setShowRaw(true)}>
                RAW
            </Chip>
        </>
    );

    return (
        <CollapsibleSection title="Logs" actions={chips} className="">
            <div className="e-card">
                {prettyLogs !== null && logMessages !== null ? (
                    showRaw ? (
                        <RawProgramLogs raw={logMessages} />
                    ) : (
                        <ProgramLogsCardBody message={message} logs={prettyLogs} cluster={cluster} url={url} />
                    )
                ) : (
                    <BaseCardBody className="e-text-sm e-text-muted">
                        Logs not supported for this transaction
                    </BaseCardBody>
                )}
            </div>
        </CollapsibleSection>
    );
}

const RawProgramLogs = ({ raw }: { raw: string[] }) => {
    return (
        <TableCardBody>
            <BaseTable.Row>
                <BaseTable.Cell>
                    <pre className="e-text-left">{JSON.stringify(raw, null, 2)}</pre>
                </BaseTable.Cell>
            </BaseTable.Row>
        </TableCardBody>
    );
};
