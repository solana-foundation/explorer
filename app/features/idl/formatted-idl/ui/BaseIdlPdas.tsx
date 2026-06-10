import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlPdas({ data }: FormattedIdlDataView<'pdas'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Seeds</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="e-font-mono e-text-xs">
                {data.map(pda => (
                    <BaseTable.Row key={pda.name}>
                        <BaseTable.Cell>
                            <HighlightNode className="e-rounded e-py-0.5">{pda.name}</HighlightNode>
                            <BaseIdlDoc docs={pda.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-2">
                                {pda.seeds.map((seed, i) => (
                                    <div key={i} className="e-flex">
                                        <BaseIdlFields fieldType={seed} />
                                    </div>
                                ))}
                            </div>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
