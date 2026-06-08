import type { FormattedIdl, InstructionAccountData } from '@entities/idl';
import { Badge } from '@shared/ui/badge';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc, IdlDocTooltip } from './BaseIdlDoc';
import { BaseIdlStructFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type IxAccountsData = NonNullable<FormattedIdl['instructions']>[0]['accounts'];
type IxArgsData = NonNullable<FormattedIdl['instructions']>[0]['args'];

export function BaseIdlInstructions({ data }: FormattedIdlDataView<'instructions'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Arguments</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="e-text-neutral-500">Accounts</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="list e-font-mono e-text-xs">
                {data.map(ix => (
                    <BaseTable.Row key={ix.name}>
                        <BaseTable.Cell>
                            <HighlightNode className="e-rounded e-py-0.5">{ix.name}</HighlightNode>
                            <BaseIdlDoc docs={ix.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <IdlInstructionArguments data={ix.args} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <IdlInstructionAccounts data={ix.accounts} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
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
                            <HighlightNode className="e-font-mono e-text-xs">{acc.name}</HighlightNode>
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
            <div>
                <HighlightNode className="e-rounded">
                    <div className="e-inline-flex e-items-center e-gap-2">
                        {name}
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
                </HighlightNode>
            </div>
        </IdlDocTooltip>
    );
}
