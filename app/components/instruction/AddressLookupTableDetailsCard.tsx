import { useCluster } from '@providers/cluster';
import React from 'react';
import { create } from 'superstruct';

import {
    AddressLookupTableInstructionInfo,
    CloseLookupTableInfo,
    CreateLookupTableInfo,
    DeactivateLookupTableInfo,
    ExtendLookupTableInfo,
    FreezeLookupTableInfo,
} from './address-lookup-table/types';
import { UnknownDetailsCard } from './UnknownDetailsCard';
import { FreezeLookupTableDetailsCard } from './address-lookup-table/FreezeLookupTableDetails';
import { CreateLookupTableDetailsCard } from './address-lookup-table/CreateLookupTableDetails';
import { InstructionDetailsProps } from '../transaction/InstructionsSection';
import { ExtendLookupTableDetailsCard } from './address-lookup-table/ExtendLookupTableDetails';
import { DeactivateLookupTableDetailsCard } from './address-lookup-table/DeactivateLookupTableDetails';
import { CloseLookupTableDetailsCard } from './address-lookup-table/CloseLookupTableDetails';

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
