import {
    address,
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    slot,
    text,
} from '@entities/instruction-card';
import { is } from 'superstruct';

import type { AddressLookupTableParsed } from '../lib/address-lookup-table-parser';
import {
    CloseLookupTableInfo,
    CreateLookupTableInfo,
    DeactivateLookupTableInfo,
    ExtendLookupTableInfo,
    FreezeLookupTableInfo,
} from '../lib/types';

const TITLE_PREFIX = 'Address Lookup Table';

export const CreateLookupTableDetailsCard = defineInstructionCard<CreateLookupTableInfo>({
    fields: info => [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
        address('Payer Account', info.payerAccount),
        slot('Recent Slot', info.recentSlot),
        text('Bump Seed', info.bumpSeed),
    ],
    title: `${TITLE_PREFIX}: Create Lookup Table`,
});

export const ExtendLookupTableDetailsCard = defineInstructionCard<ExtendLookupTableInfo>({
    fields: info => [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
        ...info.newAddresses.map((pubkey, i) => address(`New Address #${i + 1}`, pubkey)),
    ],
    title: `${TITLE_PREFIX}: Extend Lookup Table`,
});

export const FreezeLookupTableDetailsCard = defineInstructionCard<FreezeLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Freeze Lookup Table`,
});

export const DeactivateLookupTableDetailsCard = defineInstructionCard<DeactivateLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Deactivate Lookup Table`,
});

export const CloseLookupTableDetailsCard = defineInstructionCard<CloseLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Close Lookup Table`,
});

type AddressLookupTableDetailsCardProps = {
    node: InstructionNode;
    /** Already normalised by the dispatcher — this card does not decode. */
    parsed: unknown;
};

export function AddressLookupTableDetailsCard({ node, parsed }: AddressLookupTableDetailsCardProps) {
    if (!isAddressLookupTableParsed(parsed)) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX} Program: Unknown Instruction`} />;
    }

    switch (parsed.type) {
        case 'createLookupTable':
            return <CreateLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'extendLookupTable':
            return <ExtendLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'freezeLookupTable':
            return <FreezeLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'deactivateLookupTable':
            return <DeactivateLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'closeLookupTable':
            return <CloseLookupTableDetailsCard info={parsed.info} node={node} />;
    }
}

/**
 * The dispatcher hands the RPC's own view back when the slice rejects a payload, and that view
 * carries the same type strings — only the slice's schemas tell a decoded envelope from a raw one.
 */
function isAddressLookupTableParsed(parsed: unknown): parsed is AddressLookupTableParsed {
    if (typeof parsed !== 'object' || parsed === null || !('type' in parsed) || !('info' in parsed)) return false;
    switch (parsed.type) {
        case 'createLookupTable':
            return is(parsed.info, CreateLookupTableInfo);
        case 'extendLookupTable':
            return is(parsed.info, ExtendLookupTableInfo);
        case 'freezeLookupTable':
            return is(parsed.info, FreezeLookupTableInfo);
        case 'deactivateLookupTable':
            return is(parsed.info, DeactivateLookupTableInfo);
        case 'closeLookupTable':
            return is(parsed.info, CloseLookupTableInfo);
        default:
            return false;
    }
}

function tableFields(info: FreezeLookupTableInfo) {
    return [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
    ];
}
