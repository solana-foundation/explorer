import { array, enums, Infer, number, string, type, union } from 'superstruct';

import { PublicKeyFromString } from '@/app/validators/pubkey';

export type CreateLookupTableInfo = Infer<typeof CreateLookupTableInfo>;
export const CreateLookupTableInfo = type({
    bumpSeed: number(),
    lookupTableAccount: PublicKeyFromString,
    lookupTableAuthority: PublicKeyFromString,
    payerAccount: PublicKeyFromString,
    recentSlot: number(),
    systemProgram: PublicKeyFromString,
});

const LookupTableInfo = {
    lookupTableAccount: PublicKeyFromString,
    lookupTableAuthority: PublicKeyFromString,
};

export type FreezeLookupTableInfo = Infer<typeof FreezeLookupTableInfo>;
export const FreezeLookupTableInfo = type(LookupTableInfo);

export type ExtendLookupTableInfo = Infer<typeof ExtendLookupTableInfo>;
export const ExtendLookupTableInfo = type({ ...LookupTableInfo, newAddresses: array(string()) });

export type DeactivateLookupTableInfo = Infer<typeof DeactivateLookupTableInfo>;
export const DeactivateLookupTableInfo = type(LookupTableInfo);

export type CloseLookupTableInfo = Infer<typeof CloseLookupTableInfo>;
export const CloseLookupTableInfo = type({ ...LookupTableInfo, recipient: PublicKeyFromString });

export type AddressLookupTableInstructionType = Infer<typeof AddressLookupTableInstructionType>;
export const AddressLookupTableInstructionType = enums([
    'createLookupTable',
    'freezeLookupTable',
    'extendLookupTable',
    'deactivateLookupTable',
    'closeLookupTable',
]);

export type AddressLookupTableInstructionInfo = Infer<typeof AddressLookupTableInstructionInfo>;
export const AddressLookupTableInstructionInfo = type({
    info: union([CreateLookupTableInfo, FreezeLookupTableInfo, ExtendLookupTableInfo, DeactivateLookupTableInfo, CloseLookupTableInfo]),
    type: AddressLookupTableInstructionType,
});