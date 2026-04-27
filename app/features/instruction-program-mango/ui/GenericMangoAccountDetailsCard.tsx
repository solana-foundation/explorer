import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

export function GenericMangoAccountDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    mangoAccountKeyLocation: number;
    title: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, mangoAccountKeyLocation, title, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[mangoAccountKeyLocation];

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
        </InstructionCard>
    );
}
