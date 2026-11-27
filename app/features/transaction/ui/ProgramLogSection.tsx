import { TableCardBody } from '@components/common/TableCardBody';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cn } from '@components/shared/utils';
import { parseProgramLogs, ProgramLogs, toInstructionLogRows } from '@entities/program-logs';
import { useTransactionInstructionNames } from '@entities/transaction-data/client';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { SignatureProps } from '@utils/index';
import { getTransactionInstructionError } from '@utils/program-err';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { BaseCardBody } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };
export function Chip({ children, className, active, ...props }: ChipProps) {
    return (
        <Button
            variant={active ? 'default' : 'outline'}
            size="sm"
            className={cn(active && '!border-accent', className)}
            {...props}
        >
            {children}
        </Button>
    );
}

export function ProgramLogSection({ signature }: SignatureProps) {
    const [showRaw, setShowRaw] = React.useState(false);
    const { cluster } = useCluster();
    const details = useTransactionDetails(signature);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || undefined;

    const instructions = useTransactionInstructionNames(transactionWithMeta);

    const logRows = React.useMemo(
        () =>
            logMessages &&
            toInstructionLogRows({
                cluster,
                error: getTransactionInstructionError(transactionWithMeta?.meta?.err),
                instructions,
                logs: parseProgramLogs(logMessages),
            }),
        [cluster, instructions, logMessages, transactionWithMeta],
    );

    if (!transactionWithMeta) return null;

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
        <CollapsibleSection
            title="Logs"
            actions={chips}
            sectionClassName="xxl:!gap-0"
            titleClassName="xxl:sticky xxl:top-0 xxl:z-10 xxl:bg-[var(--background)] xxl:pb-3"
        >
            {logRows && logMessages ? (
                showRaw ? (
                    <RawProgramLogs raw={logMessages} />
                ) : (
                    <ProgramLogs rows={logRows} instructions={instructions} />
                )
            ) : (
                <BaseCardBody className="text-sm text-muted">Logs not supported for this transaction</BaseCardBody>
            )}
        </CollapsibleSection>
    );
}

const RawProgramLogs = ({ raw }: { raw: string[] }) => {
    return (
        <TableCardBody>
            <BaseTable.Row>
                <BaseTable.Cell>
                    <pre className="text-left">{JSON.stringify(raw, null, 2)}</pre>
                </BaseTable.Cell>
            </BaseTable.Row>
        </TableCardBody>
    );
};
