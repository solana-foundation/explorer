import { ProgramField } from '@entities/instruction-card';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { cn } from '@shared/utils';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';
import { Code } from 'react-feather';

import { BaseRawDetails } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';

type InstructionProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    innerCards?: JSX.Element[];
    childIndex?: number;
    // raw can be used to display raw instruction information
    // depends on whether the transaction was received from blockchain (TransactionInstruction)
    // or generated at the inspector (MessageCompiledInstruction)
    raw?: TransactionInstruction;
    // will be triggered on requesting raw data for instruction, if present
    onRequestRaw?: () => void;
    message: VersionedMessage;
};

export function InspectorInstructionCard({
    title,
    children,
    result,
    index,
    ix,
    defaultRaw,
    innerCards,
    childIndex,
    raw,
    onRequestRaw,
}: InstructionProps) {
    const [resultClass] = ixResult(result, index);
    const [showRaw, setShowRaw] = React.useState(defaultRaw || false);
    const rawClickHandler = () => {
        if (!defaultRaw && !showRaw && !raw) {
            // trigger handler to simulate behaviour for the InstructionCard for the transcation which contains logic in it to fetch raw transaction data
            onRequestRaw?.();
        }

        return setShowRaw(r => !r);
    };
    const scrollAnchorRef = useScrollAnchor(
        getInstructionCardScrollAnchorId(childIndex != null ? [index + 1, childIndex + 1] : [index + 1]),
    );

    return (
        <CollapsibleCard
            ref={scrollAnchorRef}
            title={
                <>
                    <span className={`badge bg-${resultClass}-soft me-2`}>
                        #{index + 1}
                        {childIndex !== undefined ? `.${childIndex + 1}` : ''}
                    </span>
                    {title}
                </>
            }
            headerButtons={
                <button
                    disabled={defaultRaw}
                    className={cn(
                        'btn btn-sm d-flex align-items-center',
                        showRaw ? 'btn-black active' : 'btn-white',
                        defaultRaw && '!e-pointer-events-auto e-cursor-not-allowed',
                    )}
                    onClick={rawClickHandler}
                >
                    <Code className="me-2" size={13} /> Raw
                </button>
            }
        >
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <tbody className="list">
                        <ProgramField programId={ix.programId} showExtendedInfo={showRaw} />
                        {showRaw ? (
                            'parsed' in ix ? (
                                <BaseRawParsedDetails ix={ix}>
                                    {raw ? <BaseRawDetails ix={raw} /> : null}
                                </BaseRawParsedDetails>
                            ) : (
                                <BaseRawDetails ix={raw || ix} />
                            )
                        ) : (
                            children
                        )}
                        {innerCards && innerCards.length > 0 && (
                            <>
                                <tr className="table-sep">
                                    <td colSpan={3}>Inner Instructions</td>
                                </tr>
                                <tr>
                                    <td colSpan={3}>
                                        <div className="inner-cards">{innerCards}</div>
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </CollapsibleCard>
    );
}

function ixResult(result: SignatureResult, index: number) {
    if (result.err) {
        const err = result.err as any;
        const ixError = err['InstructionError'];
        if (ixError && Array.isArray(ixError)) {
            const [errorIndex, error] = ixError;
            if (Number.isInteger(errorIndex) && errorIndex === index) {
                return ['warning', `Error: ${JSON.stringify(error)}`];
            }
        }
        return ['dark'];
    }
    return ['success'];
}
