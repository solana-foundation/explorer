import { Badge } from '@shared/ui/badge';

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
            <tbody className="list">
                {data.map(constant => (
                    <tr key={constant.name}>
                        <td>
                            <span className="e-font-mono e-text-xs">{constant.name}</span>
                        </td>
                        <td>
                            <div className="e-flex e-items-center e-gap-2">
                                <span className="e-font-mono e-text-xs">
                                    {JSON.stringify(constant.value, undefined, 2)}:
                                </span>
                                <Badge variant="success" size="xs">
                                    {constant.type}
                                </Badge>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
