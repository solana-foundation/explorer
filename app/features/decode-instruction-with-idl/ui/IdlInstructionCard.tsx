import { toInstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';
import { ErrorBoundary } from 'react-error-boundary';

import { type IdlInstructionDecode } from '../lib/decode-instruction-with-idl';
import { AnchorDetailsCard } from './AnchorDetailsCard';
import { CodamaInstructionCard } from './CodamaInstructionCard';

export function IdlInstructionCard({
    decoded,
    ix,
    index,
    innerCards,
    childIndex,
}: {
    decoded: IdlInstructionDecode;
    ix: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix });
    const unknownCard = <UnknownDetailsCard node={node} />;
    return (
        <ErrorBoundary fallback={unknownCard}>
            {decoded.kind === 'codama' ? (
                <CodamaInstructionCard node={node} ix={ix} parsedIx={decoded.parsedIx} />
            ) : decoded.kind === 'anchor' ? (
                <AnchorDetailsCard node={node} ix={ix} program={decoded.program} decoded={decoded.details} />
            ) : (
                unknownCard
            )}
        </ErrorBoundary>
    );
}
