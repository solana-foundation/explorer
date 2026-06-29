import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { getSpotMarketFromInstruction } from './types';

export function GenericSpotMngoDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    accountKeyLocation: number;
    spotMarketkeyLocation: number;
    title: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, accountKeyLocation, spotMarketkeyLocation, title, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[accountKeyLocation];
    const spotMarketAccountMeta = ix.keys[spotMarketkeyLocation];
    const mangoSpotMarketConfig = getSpotMarketFromInstruction(ix, spotMarketAccountMeta);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Mango Program: ${title}`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Mango account</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={mangoAccount.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            {mangoSpotMarketConfig !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Spot market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{mangoSpotMarketConfig.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Spot market address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={spotMarketAccountMeta.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
