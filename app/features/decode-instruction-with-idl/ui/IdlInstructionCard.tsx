import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ErrorBoundary } from 'react-error-boundary';

import { UnknownDetailsCard } from '@/app/components/instruction/UnknownDetailsCard';

import { type IdlInstructionDecode } from '../lib/decode-instruction-with-idl';
import { AnchorDetailsCard } from './AnchorDetailsCard';
import { CodamaInstructionCard } from './CodamaInstructionCard';

/**
 * The single place both surfaces map an `IdlInstructionDecode` kind to a renderer, so they can't drift:
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
    decoded: IdlInstructionDecode;
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const props = { childIndex, index, innerCards, ix, result };
    return (
        <ErrorBoundary fallback={<UnknownDetailsCard {...props} />}>
            {decoded.kind === 'codama' ? (
                <CodamaInstructionCard {...props} parsedIx={decoded.parsedIx} />
            ) : decoded.kind === 'anchor' ? (
                <AnchorDetailsCard
                    {...props}
                    signature={signature}
                    program={decoded.program}
                    decoded={decoded.details}
                />
            ) : (
                <UnknownDetailsCard {...props} />
            )}
        </ErrorBoundary>
    );
}
