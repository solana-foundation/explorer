import { InstructionCard } from '@components/instruction/InstructionCard';
import { parseMangoInstructionTitle } from '@explorer/decoder-mango';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

export function MangoDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, signature, innerCards, childIndex } = props;

    const { url } = useCluster();

    let title;
    try {
        title = parseMangoInstructionTitle(ix);
    } catch (error) {
        Logger.error(error, {
            signature,
            url,
        });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Mango (deprecated) Program: ${title || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
