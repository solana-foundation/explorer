import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { CodamaInstructionCard } from '../codama/CodamaInstructionDetailsCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import { withSingleInstructionDiscriminator } from './withSingleInstructionDiscriminator';

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
    const kitIx = toKitInstruction(ix);

    const tryParse = (idlRoot: RootNode) => {
        try {
            const parsedIx = parseInstruction(idlRoot, kitIx);
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
        try {
            parsedCard = tryParse(rootNodeFromAnchor(idl) as unknown as RootNode);
        } catch {
            // ignore and fallback
        }
    }

    // Fallback for single-instruction programs without discriminators (e.g. Memo)
    if (!parsedCard && idl?.kind === 'rootNode') {
        parsedCard = tryParse(withSingleInstructionDiscriminator(idl));
    }

    return parsedCard ?? <UnknownDetailsCard {...props} />;
}
