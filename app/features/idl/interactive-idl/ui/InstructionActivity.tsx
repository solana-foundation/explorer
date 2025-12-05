import { useExplorerLink } from '@entities/cluster';
import { ProgramLogs, TxErrorStatus, TxSuccessStatus } from '@entities/program-logs';
import { Card } from '@shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { ReactNode } from 'react';

import type { InstructionLogs } from '@/app/utils/program-logs';

import type { InstructionInvocationResult } from '../model/use-instruction';

type InstructionActivityProps = {
    lastResult?: InstructionInvocationResult;
    logs: string[];
    parseLogs: (logs: string[]) => InstructionLogs[];
};
export function InstructionActivity({ lastResult, logs, parseLogs }: InstructionActivityProps) {
    const tabs = [
        {
            component: (
                <ProgramLogs
                    header={lastResult && <TxStatusHeader lastResult={lastResult} />}
                    logs={logs}
                    parseLogs={parseLogs}
                />
            ),
            id: 'program-logs',
            title: 'Program logs',
        },
    ];
    return <CardWithTabs tabs={tabs} />;
}

function CardWithTabs({ tabs }: { tabs: { id: string; title: string; component: ReactNode }[] }) {
    return (
        <Card variant="tight" className="e-flex e-min-h-0 e-flex-grow e-flex-col">
            <Tabs defaultValue={tabs[0]?.id} className="e-flex e-min-h-0 e-flex-col">
                <div className="e-border-b e-border-neutral-950 e-px-6 [border-bottom-style:solid]">
                    <TabsList className="-e-mb-px">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id}>
                                {tab.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {tabs.map(tab => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="e-flex e-min-h-0 e-flex-1 e-flex-col e-px-6 e-py-2"
                    >
                        {tab.component}
                    </TabsContent>
                ))}
            </Tabs>
        </Card>
    );
}

function TxStatusHeader({ lastResult }: { lastResult: NonNullable<InstructionInvocationResult> }) {
    const { link } = useExplorerLink(
        lastResult.status === 'success'
            ? `/tx/${lastResult.signature}`
            : `/tx/inspector?message=${encodeURIComponent(lastResult.serializedTxMessage ?? '')}`
    );
    return lastResult.status === 'success' ? (
        <TxSuccessStatus signature={lastResult.signature} date={lastResult.finishedAt} link={link} />
    ) : (
        <TxErrorStatus
            message={lastResult.serializedTxMessage}
            date={lastResult.finishedAt}
            link={lastResult.serializedTxMessage ? link : null}
        />
    );
}
