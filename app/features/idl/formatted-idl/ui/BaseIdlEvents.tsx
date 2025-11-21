import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import type { FormattedIdlDataView } from './types';

export function BaseIdlEvents({ data }: FormattedIdlDataView<'events'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Fields</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(event => (
                    <tr key={event.name}>
                        <td>
                            <span className="e-font-mono e-text-xs">{event.name}</span>
                            <BaseIdlDoc docs={event.docs} />
                        </td>
                        <td>{event.fieldType && <BaseIdlFields fieldType={event.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
