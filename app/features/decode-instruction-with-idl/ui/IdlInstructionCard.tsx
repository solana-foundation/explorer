import { toInstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ErrorBoundary } from 'react-error-boundary';

import { type SourcedIdlInstructionDecode } from '../model/use-idl-instruction-decode';
import { AnchorDetailsCard } from './AnchorDetailsCard';
import { CodamaInstructionCard } from './CodamaInstructionCard';
import { CustomIdlDecodeFailureCard } from './CustomIdlDecodeFailureCard';

/**
 * The single place both surfaces map a `SourcedIdlInstructionDecode` kind to a renderer, so they can't drift:
 * codama-first, with the rich Anchor card as the fallback the strategy selects when codama can't convert
 * the IDL. ErrorBoundary'd because the Anchor coder can throw on malformed instruction data.
 */
export function IdlInstructionCard({
    decoded,
    ix,
    index,
    result,
    signature,
    innerCards,
    childIndex,
}: {
    decoded: SourcedIdlInstructionDecode;
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const nodeProps = { childIndex, index, innerCards, ix };
    if (decoded.kind === 'failed') {
        return <CustomIdlDecodeFailureCard node={toInstructionNode(nodeProps)} />;
    }
    const unknownCard = <UnknownDetailsCard node={toInstructionNode(nodeProps)} />;
    const fallback =
        decoded.source === 'custom' ? <CustomIdlDecodeFailureCard node={toInstructionNode(nodeProps)} /> : unknownCard;
    return (
        <ErrorBoundary fallback={fallback} resetKeys={[decoded]}>
            {decoded.kind === 'codama' ? (
                <CodamaInstructionCard {...nodeProps} parsedIx={decoded.parsedIx} />
            ) : decoded.kind === 'anchor' ? (
                <AnchorDetailsCard
                    {...nodeProps}
                    result={result}
                    signature={signature}
                    program={decoded.program}
                    decoded={decoded.details}
                />
            ) : (
                unknownCard
            )}
        </ErrorBoundary>
    );
}
