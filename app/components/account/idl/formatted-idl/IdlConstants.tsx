'use client';

import { FormattedIdl } from './formatters/FormattedIdl';

export function IdlConstantsView({ data }: { data?: FormattedIdl['constants'] }) {
    if (!data) return null;

    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted w-1">Name</th>
                    <th className="text-muted">Value</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(constant => (
                    <tr key={constant.name}>
                        <td>{constant.name}</td>
                        <td>
                            <div className="d-flex gap-2 align-items-center">
                                <span>{JSON.stringify(constant.value, undefined, 2)}:</span>
                                <span className="badge bg-success-soft">{constant.type}</span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
