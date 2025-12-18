import { Badge } from '@shared/ui/badge';

import { BaseIdlDoc } from './BaseIdlDoc';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlConstants({ data }: FormattedIdlDataView<'constants'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Value</th>
                </tr>
            </thead>
            <tbody className="list e-font-mono e-text-xs">
                {data.map(constant => (
                    <tr key={constant.name}>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{constant.name}</HighlightNode>
                            <BaseIdlDoc docs={constant.docs} />
                        </td>
                        <td>
                            <HighlightNode className="e-inline-flex e-rounded">
                                <div className="e-flex e-items-center e-gap-2">
                                    <span className="e-py-0.5">{JSON.stringify(constant.value, undefined, 2)}:</span>
                                    <Badge variant="success" size="xs">
                                        {constant.type}
                                    </Badge>
                                </div>
                            </HighlightNode>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
