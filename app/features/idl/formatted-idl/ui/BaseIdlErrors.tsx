import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlErrors({ data }: FormattedIdlDataView<'errors'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Code</th>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Message</th>
                </tr>
            </thead>
            <tbody className="list e-font-mono e-text-xs">
                {data.map(err => (
                    <tr key={err.code}>
                        <td className="e-text-neutral-500">
                            <HighlightNode className="e-rounded">{err.code}</HighlightNode>
                        </td>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{err.name}</HighlightNode>
                        </td>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{err.message}</HighlightNode>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
