import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { formatSerdeIdl, getFormattedIdl, getProvider } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import AnchorDetailsCard from '../AnchorDetailsCard';
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
    const { url } = useCluster();
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

    if (parsedCard) {
        return parsedCard;
    }

    // Codama couldn't parse it — most commonly an Anchor-format IDL that `@codama/nodes-from-anchor`
    // rejects (e.g. an instruction with an unnamed arg). Anchor's own BorshInstructionCoder is more
    // lenient, so build a Program from the IDL and reuse the Anchor card before giving up.
    try {
        const program = new Program(getFormattedIdl(formatSerdeIdl, idl, ix.programId.toBase58()), getProvider(url));
        return <AnchorDetailsCard {...props} anchorProgram={program as Program<Idl>} signature="" />;
    } catch (error) {
        Logger.debug('[program-metadata-idl] Anchor fallback failed', { error });
    }

    return <UnknownDetailsCard {...props} />;
}
