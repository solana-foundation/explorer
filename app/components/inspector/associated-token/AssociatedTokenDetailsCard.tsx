/**
 * Component is the resemblace of instruction/associated-token/AssociatedTokenDetailsCard
 *
 * The main difference is that component accepts MessageCompiledInstruction to allow use accountKeyIndexes to resolve proper address from address-lookup-table
 */
import { UnknownDetailsCard } from '@components/common/inspector/UnknownDetailsCard';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

import { CreateDetailsCard } from './CreateDetailsCard';
import { CreateIdempotentDetailsCard } from './CreateIdempotentDetailsCard';
import { RecoverNestedDetailsCard } from './RecoverNestedDetailsCard';

type DetailsProps =
    | Parameters<typeof CreateDetailsCard>[0]
    | Parameters<typeof CreateIdempotentDetailsCard>[0]
    | Parameters<typeof RecoverNestedDetailsCard>[0];

export function AssociatedTokenDetailsCard(props: React.PropsWithChildren<DetailsProps>) {
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
