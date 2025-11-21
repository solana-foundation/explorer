import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import type { FormattedIdlDataView } from './types';

export function BaseIdlTypes({ data }: FormattedIdlDataView<'types'>) {
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
                {data.map(typeItem => (
                    <tr key={typeItem.name}>
                        <td>
                            <span className="e-flex e-items-center e-gap-2 e-font-mono">
                                <i className="e-text-neutral-500">{typeItem.fieldType?.kind}</i>
                                {typeItem.name}
                            </span>
                            <BaseIdlDoc docs={typeItem.docs} />
                        </td>
                        <td>{typeItem.fieldType && <BaseIdlFields fieldType={typeItem.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
