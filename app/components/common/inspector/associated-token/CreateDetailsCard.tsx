import { Address } from '@components/common/Address';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import {
    MessageCompiledInstruction,
    ParsedInstruction,
    SignatureResult,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import React from 'react';

import { BaseRawDetails } from '../../BaseRawDetails';

export function CreateDetailsCard({
    childIndex,
    children,
    index,
    innerCards,
    ix,
    message,
    raw,
    result,
    InstructionCardComponent = InspectorInstructionCard,
}: {
    childIndex?: number;
    children?: React.ReactNode;
    index: number;
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    message?: VersionedMessage;
    raw: TransactionInstruction | MessageCompiledInstruction;
    result: SignatureResult;
    InstructionCardComponent?: React.FC<Parameters<typeof InspectorInstructionCard>[0]>;
}) {
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            message={message}
            raw={raw}
            result={result}
            title="Associated Token Program: Create"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            {children ? children : <BaseRawDetails ix={raw} message={message} />}
        </InstructionCardComponent>
    );
}
