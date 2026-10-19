import { toInstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';
import { ErrorBoundary } from 'react-error-boundary';

import { type SourcedIdlInstructionDecode } from '../model/use-idl-instruction-decode';
import { AnchorDetailsCard } from './AnchorDetailsCard';
import { CodamaInstructionCard } from './CodamaInstructionCard';
import { CustomIdlDecodeFailureCard } from './CustomIdlDecodeFailureCard';

export function IdlInstructionCard({
    decoded,
    ix,
    index,
    innerCards,
    childIndex,
}: {
    decoded: SourcedIdlInstructionDecode;
    ix: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix });
    if (decoded.kind === 'failed') return <CustomIdlDecodeFailureCard node={node} />;
    const unknownCard = <UnknownDetailsCard node={node} />;
    const fallback = decoded.source === 'custom' ? <CustomIdlDecodeFailureCard node={node} /> : unknownCard;
    return (
        <ErrorBoundary fallback={fallback} resetKeys={[decoded]}>
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
