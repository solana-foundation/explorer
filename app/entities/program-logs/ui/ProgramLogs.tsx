import { SolarizedJsonViewer } from '@components/common/JsonViewer';
import { Button } from '@shared/ui/button';
import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Code } from 'react-feather';

import type { InstructionLogs } from '@/app/utils/program-logs';

export function ProgramLogs({
    header,
    logs,
    parseLogs,
    programName,
}: {
    header?: React.ReactNode;
    logs: string[];
    parseLogs: (logs: string[]) => InstructionLogs[];
    programName?: string;
}) {
    const [showRaw, setShowRaw] = useState(false);

    const content = showRaw ? (
        <div className="e-rounded-lg e-bg-gray-900 e-p-3">
            <SolarizedJsonViewer
                src={logs}
                name={false}
                collapsed={false}
                style={{ fontSize: '14px', padding: '0', wordBreak: 'break-word' }}
            />
        </div>
    ) : (
        <ProgramLogRows logs={parseLogs(logs)} programName={programName} />
    );

    return (
        <div className="e-flex e-min-h-0 e-flex-col e-gap-1">
            <div className="e-flex e-justify-end">
                <Button variant={showRaw ? 'accent' : 'outline'} size="sm" onClick={() => setShowRaw(!showRaw)}>
                    <Code size={12} />
                    Raw
                </Button>
            </div>
            <div className="e-flex e-min-h-0 e-flex-col e-gap-2 e-overflow-auto">
                {header}

                {content}
            </div>
        </div>
    );
}

function ProgramLogRows({
    logs,
    programName,
}: {
    header?: React.ReactNode;
    logs: InstructionLogs[];
    programName?: string;
}) {
    return (
        <>
            {logs.length > 0 ? (
                <div>
                    {logs.map((log, index) => (
                        <ProgramLogRow key={index} entry={log} index={index} programName={programName} />
                    ))}
                </div>
            ) : (
                <div className="e-flex e-items-center e-justify-center e-pb-6 e-text-center">
                    <p className="e-m-0 e-text-sm e-italic e-text-muted">No logs yet</p>
                </div>
            )}
        </>
    );
}

function ProgramLogRow({ entry, index, programName }: { entry: InstructionLogs; index: number; programName?: string }) {
    return (
        <div>
            <div>
                <span className={instructionNumberVariants({ variant: entry.failed ? 'destructive' : 'success' })}>
                    #{index + 1}
                </span>
                <span className="e-ml-1.5 e-text-xs">{programName ? `${programName} Instruction` : 'Instruction'}</span>
            </div>
            <div className="e-flex e-flex-col e-items-start e-p-2 e-font-mono e-text-sm">
                {entry.logs.map((log, key) => {
                    return (
                        <span key={key}>
                            <span className="e-text-neutral-500">{log.prefix}</span>
                            <span className={logTextVariants({ variant: log.style })}>{log.text}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

const logTextVariants = cva('e-font-mono e-text-xs e-leading-relaxed e-m-0', {
    defaultVariants: {
        variant: 'default',
    },
    variants: {
        variant: {
            default: 'e-text-neutral-400',
            info: 'e-text-cyan-500',
            muted: 'e-text-neutral-400',
            program: 'e-text-neutral-200',
            success: 'e-text-accent',
            warning: 'e-text-destructive',
        },
    },
});

const instructionNumberVariants = cva('e-py-0.5 e-px-1 e-text-xs e-rounded', {
    variants: {
        variant: {
            destructive: 'e-text-destructive e-bg-destructive-900 ',
            success: 'e-text-accent e-bg-accent-900',
        },
    },
});
