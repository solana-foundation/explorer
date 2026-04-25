import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { getPerpMarketFromInstruction } from '@explorer/decoder-mango';

export function GenericPerpMngoDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    mangoAccountKeyLocation: number;
    perpMarketKeyLocation: number;
    title: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, mangoAccountKeyLocation, perpMarketKeyLocation, title, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[mangoAccountKeyLocation];
    const perpMarketAccountMeta = ix.keys[perpMarketKeyLocation];
    const mangoPerpMarketConfig = getPerpMarketFromInstruction(ix, perpMarketAccountMeta);

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

            {mangoPerpMarketConfig !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Perp market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{mangoPerpMarketConfig.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Perp market address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={perpMarketAccountMeta.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
