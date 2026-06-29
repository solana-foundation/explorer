import { Address } from '@components/common/Address';
import {
    ParsedInstruction,
    ParsedTransaction,
    PublicKey,
    SignatureResult,
    TransactionInstruction,
} from '@solana/web3.js';
import { camelToTitleCase } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create, Struct } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import {
    CloseInfo,
    DeployWithMaxDataLenInfo,
    ExtendProgramInfo,
    InitializeBufferInfo,
    SetAuthorityCheckedInfo,
    SetAuthorityInfo,
    UpgradeInfo,
    WriteInfo,
} from './types';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    // Raw instruction for the inspector's "Raw" account/hex toggle.
    raw?: TransactionInstruction;
};

export function BpfUpgradeableLoaderDetailsCard(props: DetailsProps) {
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);
        switch (parsed.type) {
            case 'initializeBuffer': {
                return renderDetails<InitializeBufferInfo>(props, parsed, InitializeBufferInfo);
            }
            case 'write': {
                return renderDetails<WriteInfo>(props, parsed, WriteInfo);
            }
            case 'deployWithMaxDataLen': {
                return renderDetails<DeployWithMaxDataLenInfo>(props, parsed, DeployWithMaxDataLenInfo);
            }
            case 'upgrade': {
                return renderDetails<UpgradeInfo>(props, parsed, UpgradeInfo);
            }
            case 'setAuthority': {
                return renderDetails<SetAuthorityInfo>(props, parsed, SetAuthorityInfo);
            }
            case 'setAuthorityChecked': {
                return renderDetails<SetAuthorityCheckedInfo>(props, parsed, SetAuthorityCheckedInfo);
            }
            case 'close': {
                return renderDetails<CloseInfo>(props, parsed, CloseInfo);
            }
            case 'extendProgram': {
                return renderDetails<ExtendProgramInfo>(props, parsed, ExtendProgramInfo);
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (error) {
        Logger.error(error, {
            signature: props.tx.signatures[0],
        });
        return <UnknownDetailsCard {...props} />;
    }
}

function renderDetails<T extends object>(props: DetailsProps, parsed: ParsedInfo, struct: Struct<T>) {
    const info = create(parsed.info, struct);

    const attributes: JSX.Element[] = [];
    for (const entry of Object.entries<any>(info)) {
        const key = entry[0];
        let value = entry[1];
        if (value instanceof PublicKey) {
            value = <Address pubkey={value} alignRight link />;
        } else if (key === 'bytes') {
            value = <pre className="data-wrap mb-0 inline-block text-left">{value}</pre>;
        } else if (value === null) {
            value = <span className="text-dk-gray-700">None</span>;
        }

        attributes.push(
            <BaseTable.Row key={key} data-testid={`ix-args-${key}`}>
                <BaseTable.Cell>
                    {camelToTitleCase(key)} {key === 'bytes' && <span className="text-dk-gray-700">(Base 64)</span>}
                </BaseTable.Cell>
                <BaseTable.Cell className="text-right">{value}</BaseTable.Cell>
            </BaseTable.Row>,
        );
    }

    return (
        <InstructionCard {...props} title={`BPF Upgradeable Loader: ${camelToTitleCase(parsed.type)}`}>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={props.ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {attributes}
        </InstructionCard>
    );
}
