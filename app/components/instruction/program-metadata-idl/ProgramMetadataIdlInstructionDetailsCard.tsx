import { decodeInstructionWithIdl } from '@features/decode-instruction-with-idl';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import AnchorDetailsCard from '../AnchorDetailsCard';
import { CodamaInstructionCard } from '../codama/CodamaInstructionDetailsCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

// TODO(decode-instruction-with-idl): this card is now a thin shim over `decodeInstructionWithIdl` — the
// decode strategy lives in the feature; the card only matches a decode result to its renderer. The
// intended end state is for InstructionsSection to call the helper and pick the card directly, retiring
// this component.
export function ProgramMetadataIdlInstructionDetailsCard({
    ix,
    result,
    index,
    innerCards,
    idl,
    signature,
}: {
    ix: TransactionInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    idl: any;
    // Present on the tx page; lets the Anchor fallback decode events from the transaction logs.
    signature?: string;
}) {
    const { url } = useCluster();
    const props = { index, innerCards, ix, result };

    // The Anchor fallback constructs a Program (IDL parse + BorshInstructionCoder) — don't redo it per render.
    const decoded = useMemo(() => decodeInstructionWithIdl(ix, idl, url), [ix, idl, url]);
    switch (decoded.kind) {
        case 'codama':
            return <CodamaInstructionCard {...props} parsedIx={decoded.parsedIx} />;
        case 'anchor':
            return <AnchorDetailsCard {...props} anchorProgram={decoded.program} signature={signature ?? ''} />;
        default:
            return <UnknownDetailsCard {...props} />;
    }
}
