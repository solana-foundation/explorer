import type { FormattedIdl, InstructionAccountData } from '@entities/idl';
import { Badge } from '@shared/ui/badge';

import { BaseIdlDoc, IdlDocTooltip } from './BaseIdlDoc';
import { BaseIdlStructFields } from './BaseIdlFields';
import type { FormattedIdlDataView } from './types';

type IxAccountsData = NonNullable<FormattedIdl['instructions']>[0]['accounts'];
type IxArgsData = NonNullable<FormattedIdl['instructions']>[0]['args'];

export function BaseIdlInstructions({ data }: FormattedIdlDataView<'instructions'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Arguments</th>
                    <th className="e-text-neutral-500">Accounts</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(ix => (
                    <tr key={ix.name}>
                        <td>
                            <span className="e-font-mono e-text-xs">{ix.name}</span>
                            <BaseIdlDoc docs={ix.docs} />
                        </td>
                        <td>
                            <IdlInstructionArguments data={ix.args} />
                        </td>
                        <td>
                            <IdlInstructionAccounts data={ix.accounts} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function IdlInstructionArguments({ data }: { data: IxArgsData }) {
    if (!data.length) return <>&mdash;</>;
    return <BaseIdlStructFields fields={data} />;
}

function IdlInstructionAccounts({ data }: { data: IxAccountsData }) {
    return (
        <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-1">
            {data.map(acc => {
                if ('accounts' in acc) {
                    return (
                        <div key={acc.name}>
                            <span className="e-font-mono e-text-xs">{acc.name}</span>
                            <div className="e-bg-neutral-800 e-px-3 e-py-2">
                                <InstructionAccounts accounts={acc.accounts} />
                            </div>
                        </div>
                    );
                }
                return (
                    <IdlInstructionAccount
                        key={acc.name}
                        docs={acc.docs}
                        name={acc.name}
                        isWritable={acc.writable}
                        isSigner={acc.signer}
                        isPda={acc.pda}
                        isOptional={acc.optional}
                    />
                );
            })}
        </div>
    );
}

function InstructionAccounts({ accounts }: { accounts: InstructionAccountData[] }) {
    return (
        <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-1">
            {accounts.map(({ docs, name, writable, signer, pda, optional }) => (
                <IdlInstructionAccount
                    key={name}
                    docs={docs}
                    name={name}
                    isWritable={writable}
                    isSigner={signer}
                    isPda={pda}
                    isOptional={optional}
                />
            ))}
        </div>
    );
}

function IdlInstructionAccount({
    docs,
    name,
    isWritable,
    isSigner,
    isPda,
    isOptional,
}: {
    docs: string[];
    name: string;
    isWritable?: boolean;
    isSigner?: boolean;
    isPda?: boolean;
    isOptional?: boolean;
}) {
    return (
        <IdlDocTooltip key={name} docs={docs}>
            <div className="e-inline-flex e-items-center e-gap-2">
                <span className="e-font-mono e-text-xs">{name}</span>
                <div className="e-flex e-gap-1">
                    {isWritable && (
                        <Badge variant="warning" size="xs">
                            Mutable
                        </Badge>
                    )}
                    {isSigner && (
                        <Badge variant="warning" size="xs">
                            Signer
                        </Badge>
                    )}
                    {isPda && (
                        <Badge variant="info" size="xs">
                            PDA
                        </Badge>
                    )}
                    {isOptional && (
                        <Badge variant="secondary" size="xs">
                            Optional
                        </Badge>
                    )}
                </div>
            </div>
        </IdlDocTooltip>
    );
}
