import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    isParsedInstructionProgram,
    type KitInstruction,
    type ParsedInstructionInfo,
    type ParserProgramLabel,
} from '@explorer/parsers';
import type { ParsedInstruction } from '@solana/web3.js';
import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS,
    AddressLookupTableInstruction,
    parseAddressLookupTableInstruction,
} from '@solana-program/address-lookup-table';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import {
    CloseLookupTableInfo,
    CreateLookupTableInfo,
    DeactivateLookupTableInfo,
    ExtendLookupTableInfo,
    FreezeLookupTableInfo,
} from './types';

export { ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS };

/** RPC `parsed.program` discriminator for the program; also the slice's `programLabel`. */
export const ADDRESS_LOOKUP_TABLE_PARSER_LABEL = ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL satisfies ParserProgramLabel;

/**
 * Canonical shape for a parsed Address Lookup Table instruction. The type strings and the
 * `info` field names are the RPC's, so the byte path maps the kit decoder's account names
 * (`address`, `authority`, `payer`) onto them and both paths feed one card.
 */
export type AddressLookupTableParsed =
    | ParsedInstructionInfo<'createLookupTable', CreateLookupTableInfo>
    | ParsedInstructionInfo<'extendLookupTable', ExtendLookupTableInfo>
    | ParsedInstructionInfo<'freezeLookupTable', FreezeLookupTableInfo>
    | ParsedInstructionInfo<'deactivateLookupTable', DeactivateLookupTableInfo>
    | ParsedInstructionInfo<'closeLookupTable', CloseLookupTableInfo>;

export function parseAddressLookupTableKitInstruction(ix: KitInstruction): AddressLookupTableParsed | undefined {
    try {
        const parsed = parseAddressLookupTableInstruction(ix);
        switch (parsed.instructionType) {
            case AddressLookupTableInstruction.CreateLookupTable:
                return {
                    info: create(
                        {
                            bumpSeed: parsed.data.bump,
                            lookupTableAccount: parsed.accounts.address.address,
                            lookupTableAuthority: parsed.accounts.authority.address,
                            payerAccount: parsed.accounts.payer.address,
                            recentSlot: Number(parsed.data.recentSlot),
                            systemProgram: parsed.accounts.systemProgram.address,
                        },
                        CreateLookupTableInfo,
                    ),
                    type: 'createLookupTable',
                };
            case AddressLookupTableInstruction.ExtendLookupTable:
                return {
                    info: create(
                        {
                            lookupTableAccount: parsed.accounts.address.address,
                            lookupTableAuthority: parsed.accounts.authority.address,
                            newAddresses: parsed.data.addresses,
                        },
                        ExtendLookupTableInfo,
                    ),
                    type: 'extendLookupTable',
                };
            case AddressLookupTableInstruction.FreezeLookupTable:
                return { info: create(tableInfo(parsed.accounts), FreezeLookupTableInfo), type: 'freezeLookupTable' };
            case AddressLookupTableInstruction.DeactivateLookupTable:
                return {
                    info: create(tableInfo(parsed.accounts), DeactivateLookupTableInfo),
                    type: 'deactivateLookupTable',
                };
            case AddressLookupTableInstruction.CloseLookupTable:
                return {
                    info: create(
                        { ...tableInfo(parsed.accounts), recipient: parsed.accounts.recipient.address },
                        CloseLookupTableInfo,
                    ),
                    type: 'closeLookupTable',
                };
        }
    } catch {
        // An unknown discriminator or a short account list; the dispatcher renders that as unknown.
        return undefined;
    }
}

/** Normalise an RPC-pre-parsed Address Lookup Table instruction into `AddressLookupTableParsed`. */
export function parseAddressLookupTableRpcInstruction(ix: ParsedInstruction): AddressLookupTableParsed | undefined {
    if (!isParsedInstructionProgram(ix, ADDRESS_LOOKUP_TABLE_PARSER_LABEL)) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'createLookupTable':
                return { info: create(ix.parsed.info, CreateLookupTableInfo), type: 'createLookupTable' };
            case 'extendLookupTable':
                return { info: create(ix.parsed.info, ExtendLookupTableInfo), type: 'extendLookupTable' };
            case 'freezeLookupTable':
                return { info: create(ix.parsed.info, FreezeLookupTableInfo), type: 'freezeLookupTable' };
            case 'deactivateLookupTable':
                return { info: create(ix.parsed.info, DeactivateLookupTableInfo), type: 'deactivateLookupTable' };
            case 'closeLookupTable':
                return { info: create(ix.parsed.info, CloseLookupTableInfo), type: 'closeLookupTable' };
            default:
                return undefined;
        }
    } catch (error) {
        // The program label already matched, so a validation failure here means the RPC sent a payload
        // we don't model — worth surfacing. Returning undefined falls back to the unknown-instruction card.
        Logger.error(error, { instructionType: ix.parsed.type, program: ix.program });
        return undefined;
    }
}

function tableInfo(accounts: { address: { address: string }; authority: { address: string } }) {
    return { lookupTableAccount: accounts.address.address, lookupTableAuthority: accounts.authority.address };
}
