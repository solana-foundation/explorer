import { Address } from '@components/common/Address';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { MessageCompiledInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';
import { Code } from 'react-feather';

import { CProp } from '@/app/types/generics';

import { BaseInstructionCard, BaseProps } from './BaseInstructionCard';
import { BaseRawDetails } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';

type TitleLessBaseProps = Omit<BaseProps, 'title'>;

type InspectorInstructionProps = Pick<CProp<typeof BaseInstructionCard>, 'onRequestRaw'> &
    TitleLessBaseProps & {
        // raw can be used to display raw instruction information
        // depends on whether the transaction was received from blockchain (TransactionInstruction)
        // or generated at the inspector (MessageCompiledInstruction)
        raw?: TransactionInstruction | MessageCompiledInstruction;
        message: VersionedMessage;
        title?: string; // title is optional to allow HOCs that use this card to define title themselves (TokenDetailsCard for ex.)
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
    message,
}: InspectorInstructionProps) {
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
        getInstructionCardScrollAnchorId(childIndex != null ? [index + 1, childIndex + 1] : [index + 1])
    );

    return (
        <div className="card" ref={scrollAnchorRef}>
            <div className="card-header">
                <h3 className="card-header-title mb-0 d-flex align-items-center">
                    <span className={`badge bg-${resultClass}-soft me-2`}>
                        #{index + 1}
                        {childIndex !== undefined ? `.${childIndex + 1}` : ''}
                    </span>
                    {title}
                </h3>

                <button
                    disabled={defaultRaw}
                    className={`btn btn-sm d-flex align-items-center ${showRaw ? 'btn-black active' : 'btn-white'}`}
                    onClick={rawClickHandler}
                >
                    <Code className="me-2" size={13} /> Raw
                </button>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <tbody className="list">
                        {showRaw ? (
                            <>
                                <tr>
                                    <td>Program</td>
                                    <td className="text-lg-end">
                                        <Address pubkey={ix.programId} alignRight link />
                                    </td>
                                </tr>
                                {'parsed' in ix ? (
                                    <BaseRawParsedDetails ix={ix}>
                                        {raw ? <BaseRawDetails ix={raw} message={message} /> : null}
                                    </BaseRawParsedDetails>
                                ) : (
                                    <BaseRawDetails ix={raw || ix} message={message} />
                                )}
                            </>
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
        </div>
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
