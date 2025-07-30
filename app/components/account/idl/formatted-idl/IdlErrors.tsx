'use client';

import { FormattedIdl } from './formatters/FormattedIdl';

export function IdlErrorsView({ data }: { data?: FormattedIdl['errors'] }) {
    if (!data) return null;

    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted w-1">Code</th>
                    <th className="text-muted">Name</th>
                    <th className="text-muted">Message</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(err => (
                    <tr key={err.code}>
                        <td className="text-muted">{err.code}</td>
                        <td>{err.name}</td>
                        <td>{err.message}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
