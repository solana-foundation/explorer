/**
 * Component is the resemblace of instruction/associated-token/AssociatedTokenDetailsCard
 *
 * The main difference is that we omit parsed data. Transaction created from VersionedMessage that is used at inspector does not have parsed data which is present at transaction fetched from blockchain by its signature.
 */
import { CreateDetailsCard } from '@components/common/inspector/associated-token/CreateDetailsCard';
import { CreateIdempotentDetailsCard } from '@components/common/inspector/associated-token/CreateIdempotentDetailsCard';
import { RecoverNestedDetailsCard } from '@components/common/inspector/associated-token/RecoverNestedDetailsCard';
import { UnknownDetailsCard } from '@components/common/inspector/UnknownDetailsCard';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import {
    MessageCompiledInstruction,
    ParsedInstruction,
    SignatureResult,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

type DetailsProps = {
    childIndex?: number;
    children?: React.ReactNode;
    index: number;
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    message?: VersionedMessage;
    raw: TransactionInstruction | MessageCompiledInstruction;
    result: SignatureResult;
    InstructionCardComponent?: React.FC<Parameters<typeof InspectorInstructionCard>[0]>;
};

export function AssociatedTokenDetailsCard(props: DetailsProps) {
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);
        switch (parsed.type) {
            case 'create': {
                return <CreateDetailsCard {...props} />;
            }
            case 'createIdempotent': {
                return <CreateIdempotentDetailsCard {...props} />;
            }
            case 'recoverNested': {
                return <RecoverNestedDetailsCard {...props} />;
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (_error) {
        return <UnknownDetailsCard {...props} />;
    }
}
