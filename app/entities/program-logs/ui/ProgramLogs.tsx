import { SolarizedJsonViewer } from '@components/common/JsonViewer';
import { Button } from '@components/shared/ui/button';
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
        <div className="overflow-hidden rounded-lg">
            <SolarizedJsonViewer
                src={logs}
                name={false}
                enableClipboard={true}
                collapsed={false}
                displayObjectSize={false}
                displayDataTypes={false}
                displayArrayKey={false}
                style={{ padding: 25, wordBreak: 'break-word' }}
            />
        </div>
    ) : (
        <ProgramLogRows logs={parseLogs(logs)} programName={programName} />
    );

    return (
        <div className="flex min-h-0 flex-col gap-1">
            <div className="flex justify-end">
                <Button variant={showRaw ? 'accent' : 'outline'} size="sm" onClick={() => setShowRaw(!showRaw)}>
                    <Code size={12} />
                    Raw
                </Button>
            </div>
            <div className="flex min-h-0 flex-col gap-2 overflow-auto">
                {header}

                <div className="overflow-x-auto">{content}</div>
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
                <div className="flex items-center justify-center pb-6 text-center">
                    <p className="m-0 text-sm italic text-muted">No logs yet</p>
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
                <span className="ml-1.5 text-xs">{programName ? `${programName} Instruction` : 'Instruction'}</span>
            </div>
            <div className="flex flex-col items-start p-2 font-mono text-sm">
                {entry.logs.map((log, key) => {
                    return (
                        <span key={key}>
                            <span className="text-neutral-500">{log.prefix}</span>
                            <span className={logTextVariants({ variant: log.style })}>{log.text}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

const logTextVariants = cva('font-mono text-xs leading-relaxed m-0', {
    defaultVariants: {
        variant: 'default',
    },
    variants: {
        variant: {
            default: 'text-neutral-400',
            info: 'text-cyan-500',
            muted: 'text-neutral-400',
            program: 'text-neutral-200',
            success: 'text-accent',
            warning: 'text-destructive',
        },
    },
});

const instructionNumberVariants = cva('py-0.5 px-1 text-xs rounded', {
    variants: {
        variant: {
            destructive: 'text-destructive bg-destructive-900 ',
            success: 'text-accent bg-accent-900',
        },
    },
});
