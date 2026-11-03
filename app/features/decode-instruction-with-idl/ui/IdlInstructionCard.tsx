import { DecodedInstructionCard, type RawInstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { capitalizeFirstLetter } from '@utils/index';
import { ErrorBoundary } from 'react-error-boundary';

import { type IdlInstructionDecode } from '../lib/decode-instruction-with-idl';
import { AnchorDetailsCard } from './AnchorDetailsCard';
import { CodamaInstructionCard } from './CodamaInstructionCard';

export function IdlInstructionCard({ node, decoded }: { node: RawInstructionNode; decoded: IdlInstructionDecode }) {
    const unknownCard = <UnknownDetailsCard node={node} />;
    return (
        <ErrorBoundary fallback={unknownCard}>
            {decoded.kind === 'codama' ? (
                <CodamaInstructionCard node={node} parsedIx={decoded.parsedIx} />
            ) : decoded.kind === 'anchor' ? (
                <AnchorDetailsCard node={node} program={decoded.program} decoded={decoded.details} />
            ) : decoded.kind === 'self-cpi-event' ? (
                // an emit_cpi self-CPI renders as the event it carries (1 account: the event authority)
                <DecodedInstructionCard
                    node={node}
                    title={`${decoded.programName}: ${capitalizeFirstLetter(decoded.name)}`}
                    programName={decoded.programName}
                    accountNames={['eventAuthority']}
                    args={decoded.args}
                />
            ) : (
                unknownCard
            )}
        </ErrorBoundary>
    );
}
