import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { RootNode } from 'codama';

import { upcastTransactionInstruction } from '../../inspector/into-parsed-data';
import { CodamaInstructionCard } from '../codama/CodamaInstructionDetailsCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

export function ProgramMetadataIdlInstructionDetailsCard({
    ix,
    result,
    index,
    innerCards,
    idl,
}: {
    ix: TransactionInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    idl: any;
}) {
    const props = {
        index,
        innerCards,
        ix,
        result,
    };
    const upcastedIx = upcastTransactionInstruction(ix);

    // Try parsing with the provided idl, then fallback to rootNodeFromAnchor(idl)
    const tryParse = (idlRoot: RootNode) => {
        try {
            const parsedIx = parseInstruction(idlRoot, upcastedIx);
            if (parsedIx) {
                return <CodamaInstructionCard {...props} parsedIx={parsedIx} />;
            }
        } catch {
            // ignore and fallback
        }
        return null;
    };

    let parsedCard = tryParse(idl as RootNode);
    if (!parsedCard) {
        parsedCard = tryParse(rootNodeFromAnchor(idl) as unknown as RootNode);
    }
    return parsedCard ?? <UnknownDetailsCard {...props} />;
}
