import { parseInstruction } from '@codama/dynamic-parsers';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { RootNode } from 'codama';

import { upcastTransactionInstruction } from '../../inspector/into-parsed-data';
import { CodamaInstructionCard } from '../codama/CodamaInstructionDetailsCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

const PmpCodamaIdl = import('@/app/pmp.json');

export function ProgramMetadataDetailsCard(props: {
    ix: TransactionInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
}) {
    const parsedIx = parseInstruction(PmpCodamaIdl as any as RootNode, upcastTransactionInstruction(props.ix));
    if (!parsedIx) {
        return <UnknownDetailsCard {...props} />;
    }
    return <CodamaInstructionCard {...props} parsedIx={parsedIx} />;
}
