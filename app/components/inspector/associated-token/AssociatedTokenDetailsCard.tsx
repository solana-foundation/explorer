/**
 * Component is the resemblace of instruction/associated-token/AssociatedTokenDetailsCard
 *
 * The main difference is that we omit parsed data. Transaction created from VersionedMessage that is used at inspector does not have parsed data which is present at transaction fetched from blockchain by its signature.
 */
import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { BaseCreateDetailsCard as CreateDetailsCard } from '@components/common/instruction/associated-token/BaseCreateDetailsCard';
import { BaseCreateIdempotentDetailsCard as CreateIdempotentDetailsCard } from '@components/common/instruction/associated-token/BaseCreateIdempotentDetailsCard';
import { BaseRecoverNestedDetailsCard as RecoverNestedDetailsCard } from '@components/common/instruction/associated-token/BaseRecoverNestedDetailsCard';
import { BaseUnknownDetailsCard as UnknownDetailsCard } from '@components/common/instruction/BaseUnknownDetailsCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

type DetailsProps = {
    raw: TransactionInstruction;
    ix: ParsedInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
    children: React.ReactNode;
    InstructionCardComponent?: React.FC<Parameters<typeof BaseInstructionCard>[0]>;
};

export function AssociatedTokenDetailsCard(props: DetailsProps) {
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);
        switch (parsed.type) {
            case 'create': {
                return <CreateDetailsCard {...props} />;
            }
            case 'createIdempotent': {
                return <CreateIdempotentDetailsCard info={parsed.info} {...props} />;
            }
            case 'recoverNested': {
                return <RecoverNestedDetailsCard info={parsed.info} {...props} />;
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (_error) {
        return <UnknownDetailsCard {...props} />;
    }
}
