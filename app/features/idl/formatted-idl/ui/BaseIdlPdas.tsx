import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlPdas({ data }: FormattedIdlDataView<'pdas'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Seeds</th>
                </tr>
            </thead>
            <tbody className="list e-font-mono e-text-xs">
                {data.map(pda => (
                    <tr key={pda.name}>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{pda.name}</HighlightNode>
                            <BaseIdlDoc docs={pda.docs} />
                        </td>
                        <td>
                            <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-2">
                                {pda.seeds.map((seed, i) => (
                                    <div key={i} className="e-flex">
                                        <BaseIdlFields fieldType={seed} />
                                    </div>
                                ))}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
