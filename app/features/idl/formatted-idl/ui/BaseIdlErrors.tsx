import { BaseTable } from '@/app/shared/ui/Table';

import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlErrors({ data }: FormattedIdlDataView<'errors'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="text-neutral-500">Code</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="text-neutral-500">Message</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="font-mono text-xs">
                {data.map(err => (
                    <BaseTable.Row key={err.code}>
                        <BaseTable.Cell className="text-neutral-500">
                            <HighlightNode className="rounded">{err.code}</HighlightNode>
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <HighlightNode className="rounded py-0.5">{err.name}</HighlightNode>
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <HighlightNode className="rounded py-0.5">{err.message}</HighlightNode>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
