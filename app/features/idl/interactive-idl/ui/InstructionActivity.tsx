import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/shared/ui/tabs';
import { useExplorerLink } from '@entities/cluster';
import { ProgramLogs, TxErrorStatus, TxSuccessStatus } from '@entities/program-logs';
import { ReactNode } from 'react';

import { Card } from '@/app/shared/ui/Card';
import type { InstructionLogs } from '@/app/utils/program-logs';

import type { InstructionInvocationResult } from '../model/use-instruction';

type InstructionActivityProps = {
    lastResult?: InstructionInvocationResult;
    logs: string[];
    parseLogs: (logs: string[]) => InstructionLogs[];
};
// FIXME: missing Storybook story — pure props, but uses useExplorerLink internally so needs withCluster decorator.
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
        <Card variant="tight" className="flex min-h-0 flex-grow flex-col">
            <Tabs defaultValue={tabs[0]?.id} className="flex min-h-0 flex-col">
                <div className="border-b border-neutral-950 px-6 [border-bottom-style:solid]">
                    <TabsList className="-mb-px">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id}>
                                {tab.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {tabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id} className="flex min-h-0 flex-1 flex-col px-6 py-2">
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
            : `/tx/inspector?message=${encodeURIComponent(lastResult.serializedTxMessage ?? '')}`,
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
