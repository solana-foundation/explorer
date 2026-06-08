import { Badge } from '@shared/ui/badge';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlConstants({ data }: FormattedIdlDataView<'constants'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Value</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="list e-font-mono e-text-xs">
                {data.map(constant => (
                    <BaseTable.Row key={constant.name}>
                        <BaseTable.Cell>
                            <HighlightNode className="e-rounded e-py-0.5">{constant.name}</HighlightNode>
                            <BaseIdlDoc docs={constant.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <HighlightNode className="e-inline-flex e-rounded">
                                <div className="e-flex e-items-center e-gap-2">
                                    <span className="e-py-0.5">{JSON.stringify(constant.value, undefined, 2)}:</span>
                                    <Badge variant="success" size="xs">
                                        {constant.type}
                                    </Badge>
                                </div>
                            </HighlightNode>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
