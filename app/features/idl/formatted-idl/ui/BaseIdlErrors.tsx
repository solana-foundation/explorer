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
            <tbody className="list">
                {data.map(err => (
                    <tr key={err.code}>
                        <td className="e-font-mono e-text-neutral-500">{err.code}</td>
                        <td>
                            <span className="e-font-mono e-text-xs">{err.name}</span>
                        </td>
                        <td>
                            <p className="e-mb-0 e-font-mono e-text-xs">{err.message}</p>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
