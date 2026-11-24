import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ChevronsUp } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

import type { LogRow } from '../model/to-log-rows';

type InstructionTitle = {
    name?: string;
    programName?: string;
    programId: { toBase58(): string };
};

export function ProgramLogs({
    rows,
    instructions,
    density = 'even',
}: {
    rows: readonly LogRow[];
    instructions?: readonly InstructionTitle[];
    density?: TableCardBodyProps['density'];
}) {
    return (
        <TableCardBody density={density} layout="expanded">
            {rows.map((row, index) => {
                const instruction = instructions?.[index];

                return (
                    <BaseTable.Row key={index} data-ix-index={index}>
                        <BaseTable.Cell>
                            {instruction ? (
                                <InstructionLink index={index}>
                                    <RowHeading index={index} status={row.status} title={toTitle(instruction)} />
                                    <ChevronsUp className="m-1.5 cursor-pointer" size={13} />
                                </InstructionLink>
                            ) : (
                                <div className="flex items-baseline">
                                    <RowHeading index={index} status={row.status} title={UNNAMED_INSTRUCTION_TITLE} />
                                </div>
                            )}
                            {row.lines.length > 0 && (
                                <div className="flex flex-col items-start whitespace-pre-wrap break-all py-1.5 font-mono">
                                    {row.lines.map((line, key) => (
                                        <span key={key}>
                                            <span className="text-dk-gray-700">{line.prefix}</span>
                                            <span className={logTextVariants({ variant: line.style })}>
                                                {line.text}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            })}
        </TableCardBody>
    );
}

function InstructionLink({ index, children }: React.PropsWithChildren<{ index: number }>) {
    return (
        <Link className="flex items-baseline" href={`#${getInstructionCardScrollAnchorId([index + 1])}`}>
            {children}
        </Link>
    );
}

function RowHeading({ index, status, title }: { index: number; status: LogRow['status']; title: string }) {
    return (
        <>
            <Badge ui="dashkit" variant={BADGE_VARIANT[status]} baseline className="mr-1.5">
                #{index + 1}
            </Badge>
            <span className="text-dk-white [overflow-wrap:anywhere]">{title}</span>
        </>
    );
}

const BADGE_VARIANT = { failed: 'warning', none: 'default', success: 'success' } as const;

const UNNAMED_INSTRUCTION_TITLE = 'Instruction';
const PROGRAM_SUFFIX = ' Program';

function toTitle({ name, programName, programId }: InstructionTitle): string {
    const program = programName?.endsWith(PROGRAM_SUFFIX)
        ? programName.slice(0, -PROGRAM_SUFFIX.length)
        : (programName ?? programId.toBase58());

    return `${program} ${name ?? UNNAMED_INSTRUCTION_TITLE}`;
}

const logTextVariants = cva('', {
    variants: {
        variant: {
            info: 'text-dk-info',
            muted: 'text-dk-gray-700',
            success: 'text-dk-success-on-dark',
            warning: 'text-dk-warning-on-dark',
        },
    },
});
