import { useCluster } from '@providers/cluster';
import React from 'react';
import { create } from 'superstruct';

import { CloseLookupTableDetailsCard } from '@/app/components/instruction/address-lookup-table/CloseLookupTableDetails';
import { CreateLookupTableDetailsCard } from '@/app/components/instruction/address-lookup-table/CreateLookupTableDetails';
import { DeactivateLookupTableDetailsCard } from '@/app/components/instruction/address-lookup-table/DeactivateLookupTableDetails';
import { ExtendLookupTableDetailsCard } from '@/app/components/instruction/address-lookup-table/ExtendLookupTableDetails';
import { FreezeLookupTableDetailsCard } from '@/app/components/instruction/address-lookup-table/FreezeLookupTableDetails';
import {
    AddressLookupTableInstructionInfo,
    CloseLookupTableInfo,
    CreateLookupTableInfo,
    DeactivateLookupTableInfo,
    ExtendLookupTableInfo,
    FreezeLookupTableInfo,
} from '@/app/components/instruction/address-lookup-table/types';
import { UnknownDetailsCard } from '@/app/components/instruction/UnknownDetailsCard';
import { InstructionDetailsProps } from '@/app/components/transaction/InstructionsSection';

export function AddressLookupTableDetailsCard(props: InstructionDetailsProps) {
    const { ix } = props;
    const { url } = useCluster();

    try {
        const parsed = create(ix.parsed, AddressLookupTableInstructionInfo);
        switch (parsed.type) {
            case 'createLookupTable': {
                return <CreateLookupTableDetailsCard {...props} info={parsed.info as CreateLookupTableInfo} />;
            }
            case 'extendLookupTable': {
                return <ExtendLookupTableDetailsCard {...props} info={parsed.info as ExtendLookupTableInfo} />;
            }
            case 'freezeLookupTable': {
                return <FreezeLookupTableDetailsCard {...props} info={parsed.info as FreezeLookupTableInfo} />;
            }
            case 'deactivateLookupTable': {
                return <DeactivateLookupTableDetailsCard {...props} info={parsed.info as DeactivateLookupTableInfo} />;
            }
            case 'closeLookupTable': {
                return <CloseLookupTableDetailsCard {...props} info={parsed.info as CloseLookupTableInfo} />;
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (error) {
        console.error(error, {
            signature: props.tx.signatures[0],
            url: url,
        });
        return <UnknownDetailsCard {...props} />;
    }
}
