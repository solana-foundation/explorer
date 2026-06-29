import { Address } from '@components/common/Address';
import { BPF_LOADER_PROGRAM_ID, ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';
import { wrap } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import { FinalizeInfo, WriteInfo } from './types';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function BpfLoaderDetailsCard(props: DetailsProps) {
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);

        switch (parsed.type) {
            case 'write': {
                const info = create(parsed.info, WriteInfo);
                return <BpfLoaderWriteDetailsCard info={info} {...props} />;
            }
            case 'finalize': {
                const info = create(parsed.info, FinalizeInfo);
                return <BpfLoaderFinalizeDetailsCard info={info} {...props} />;
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

type Props<T> = {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: T;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function BpfLoaderWriteDetailsCard(props: Props<WriteInfo>) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const bytes = wrap(info.bytes, 50);
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="BPF Loader 2: Write"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={BPF_LOADER_PROGRAM_ID} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.account} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>
                    Bytes <span className="text-dk-gray-700">(Base 64)</span>
                </BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <pre className="mb-0 inline-block text-left">{bytes}</pre>
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Offset</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.offset}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}

export function BpfLoaderFinalizeDetailsCard(props: Props<FinalizeInfo>) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="BPF Loader 2: Finalize"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={BPF_LOADER_PROGRAM_ID} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.account} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
