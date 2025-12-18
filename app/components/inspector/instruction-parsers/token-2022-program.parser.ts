import {
    EmitTokenMetadataInfo,
    InitializeGroupMemberPointerInfo,
    InitializeGroupPointerInfo,
    InitializeMetadataPointerInfo,
    InitializeTokenGroupInfo,
    InitializeTokenGroupMemberInfo,
    InitializeTokenMetadataInfo,
    RemoveTokenMetadataKeyInfo,
    UpdateGroupMemberPointerInfo,
    UpdateGroupPointerInfo,
    UpdateMetadataPointerInfo,
    UpdateTokenGroupMaxSizeInfo,
    UpdateTokenGroupUpdateAuthorityInfo,
    UpdateTokenMetadataFieldInfo,
    UpdateTokenMetadataUpdateAuthorityInfo,
} from '@components/instruction/token/types';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    identifyToken2022Instruction,
    parseEmitTokenMetadataInstruction,
    parseInitializeGroupMemberPointerInstruction,
    parseInitializeGroupPointerInstruction,
    parseInitializeMetadataPointerInstruction,
    parseInitializeTokenGroupInstruction,
    parseInitializeTokenGroupMemberInstruction,
    parseInitializeTokenMetadataInstruction,
    parseRemoveTokenMetadataKeyInstruction,
    parseUpdateGroupMemberPointerInstruction,
    parseUpdateGroupPointerInstruction,
    parseUpdateMetadataPointerInstruction,
    parseUpdateTokenGroupMaxSizeInstruction,
    parseUpdateTokenGroupUpdateAuthorityInstruction,
    parseUpdateTokenMetadataFieldInstruction,
    parseUpdateTokenMetadataUpdateAuthorityInstruction,
    Token2022Instruction,
} from '@solana-program/token-2022';

import { intoInstructionData } from '../into-parsed-data';

/**
 * Helper function to safely convert BigInt or number to regular number
 */
function safeNumber(value: bigint | number): number {
    if (typeof value === 'bigint') {
        return Number(value);
    }
    return value;
}

/**
 * Helper function to convert TokenMetadataField to a string representation
 * Standard fields: Name, Symbol, Uri -> lowercase
 * Custom key field: Key with fields[0] containing the key name
 */
function tokenMetadataFieldToString(field: { __kind: string; fields?: readonly [string] }): string {
    return field.fields?.[0] ?? field.__kind.toLowerCase();
}

/**
 * Convert parsed Token-2022 InitializeTokenMetadata instruction to RPC format
 */
function convertInitializeTokenMetadataInfo(parsed: any): InitializeTokenMetadataInfo {
    return {
        metadata: new PublicKey(parsed.accounts.metadata.address),
        mint: new PublicKey(parsed.accounts.mint.address),
        mintAuthority: new PublicKey(parsed.accounts.mintAuthority.address),
        name: parsed.data.name,
        symbol: parsed.data.symbol,
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
        uri: parsed.data.uri,
    };
}

/**
 * Convert parsed Token-2022 UpdateTokenMetadataField instruction to RPC format
 */
function convertUpdateTokenMetadataFieldInfo(parsed: any): UpdateTokenMetadataFieldInfo {
    return {
        field: tokenMetadataFieldToString(parsed.data.field),
        metadata: new PublicKey(parsed.accounts.metadata.address),
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
        value: parsed.data.value,
    };
}

/**
 * Convert parsed Token-2022 RemoveTokenMetadataKey instruction to RPC format
 */
function convertRemoveTokenMetadataKeyInfo(parsed: any): RemoveTokenMetadataKeyInfo {
    return {
        idempotent: parsed.data.idempotent,
        key: parsed.data.key,
        metadata: new PublicKey(parsed.accounts.metadata.address),
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
    };
}

/**
 * Convert parsed Token-2022 UpdateTokenMetadataUpdateAuthority instruction to RPC format
 */
function convertUpdateTokenMetadataUpdateAuthorityInfo(parsed: any): UpdateTokenMetadataUpdateAuthorityInfo {
    return {
        metadata: new PublicKey(parsed.accounts.metadata.address),
        newUpdateAuthority: new PublicKey(parsed.data.newUpdateAuthority),
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
    };
}

/**
 * Convert parsed Token-2022 EmitTokenMetadata instruction to RPC format
 */
function convertEmitTokenMetadataInfo(parsed: any): EmitTokenMetadataInfo {
    return {
        end: parsed.data.end ? safeNumber(parsed.data.end) : null,
        metadata: new PublicKey(parsed.accounts.metadata.address),
        start: parsed.data.start ? safeNumber(parsed.data.start) : null,
    };
}

/**
 * Convert parsed Token-2022 InitializeMetadataPointer instruction to RPC format
 */
function convertInitializeMetadataPointerInfo(parsed: any): InitializeMetadataPointerInfo {
    return {
        authority: new PublicKey(parsed.data.authority),
        metadataAddress: new PublicKey(parsed.data.metadataAddress),
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 UpdateMetadataPointer instruction to RPC format
 */
function convertUpdateMetadataPointerInfo(parsed: any): UpdateMetadataPointerInfo {
    return {
        authority: new PublicKey(parsed.accounts.authority.address),
        metadataAddress: parsed.data.metadataAddress ? new PublicKey(parsed.data.metadataAddress) : null,
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 InitializeGroupPointer instruction to RPC format
 */
function convertInitializeGroupPointerInfo(parsed: any): InitializeGroupPointerInfo {
    return {
        authority: new PublicKey(parsed.data.authority),
        groupAddress: new PublicKey(parsed.data.groupAddress),
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 UpdateGroupPointer instruction to RPC format
 */
function convertUpdateGroupPointerInfo(parsed: any): UpdateGroupPointerInfo {
    return {
        authority: new PublicKey(parsed.accounts.authority.address),
        groupAddress: parsed.data.groupAddress ? new PublicKey(parsed.data.groupAddress) : null,
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 InitializeGroupMemberPointer instruction to RPC format
 */
function convertInitializeGroupMemberPointerInfo(parsed: any): InitializeGroupMemberPointerInfo {
    return {
        authority: new PublicKey(parsed.data.authority),
        memberAddress: new PublicKey(parsed.data.memberAddress),
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 UpdateGroupMemberPointer instruction to RPC format
 */
function convertUpdateGroupMemberPointerInfo(parsed: any): UpdateGroupMemberPointerInfo {
    return {
        authority: new PublicKey(parsed.accounts.authority.address),
        memberAddress: parsed.data.memberAddress ? new PublicKey(parsed.data.memberAddress) : null,
        mint: new PublicKey(parsed.accounts.mint.address),
    };
}

/**
 * Convert parsed Token-2022 InitializeTokenGroup instruction to RPC format
 */
function convertInitializeTokenGroupInfo(parsed: any): InitializeTokenGroupInfo {
    return {
        group: new PublicKey(parsed.accounts.group.address),
        maxSize: parsed.data.maxSize,
        mint: new PublicKey(parsed.accounts.mint.address),
        mintAuthority: new PublicKey(parsed.accounts.mintAuthority.address),
        updateAuthority: new PublicKey(parsed.data.updateAuthority),
    };
}

/**
 * Convert parsed Token-2022 UpdateTokenGroupMaxSize instruction to RPC format
 */
function convertUpdateTokenGroupMaxSizeInfo(parsed: any): UpdateTokenGroupMaxSizeInfo {
    return {
        group: new PublicKey(parsed.accounts.group.address),
        maxSize: parsed.data.maxSize,
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
    };
}

/**
 * Convert parsed Token-2022 UpdateTokenGroupUpdateAuthority instruction to RPC format
 */
function convertUpdateTokenGroupUpdateAuthorityInfo(parsed: any): UpdateTokenGroupUpdateAuthorityInfo {
    return {
        group: new PublicKey(parsed.accounts.group.address),
        newUpdateAuthority: new PublicKey(parsed.data.newUpdateAuthority),
        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
    };
}

/**
 * Convert parsed Token-2022 InitializeTokenGroupMember instruction to RPC format
 */
function convertInitializeTokenGroupMemberInfo(parsed: any): InitializeTokenGroupMemberInfo {
    return {
        group: new PublicKey(parsed.accounts.group.address),
        groupUpdateAuthority: new PublicKey(parsed.accounts.groupUpdateAuthority.address),
        member: new PublicKey(parsed.accounts.member.address),
        memberMint: new PublicKey(parsed.accounts.memberMint.address),
        memberMintAuthority: new PublicKey(parsed.accounts.memberMintAuthority.address),
    };
}

/**
 * Parse Token-2022 instruction and return parsed data in RPC format
 */
export function parseToken2022Instruction(instruction: TransactionInstruction): { type: string; info: any } | null {
    const { data } = instruction;

    try {
        const instructionType = identifyToken2022Instruction(data);

        switch (instructionType) {
            case Token2022Instruction.InitializeTokenMetadata: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeTokenMetadataInstruction(idata);
                return {
                    info: convertInitializeTokenMetadataInfo(parsedIx),
                    type: 'initializeTokenMetadata',
                };
            }
            case Token2022Instruction.UpdateTokenMetadataField: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateTokenMetadataFieldInstruction(idata);
                return {
                    info: convertUpdateTokenMetadataFieldInfo(parsedIx),
                    type: 'updateTokenMetadataField',
                };
            }
            case Token2022Instruction.RemoveTokenMetadataKey: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseRemoveTokenMetadataKeyInstruction(idata);
                return {
                    info: convertRemoveTokenMetadataKeyInfo(parsedIx),
                    type: 'removeTokenMetadataKey',
                };
            }
            case Token2022Instruction.UpdateTokenMetadataUpdateAuthority: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateTokenMetadataUpdateAuthorityInstruction(idata);
                return {
                    info: convertUpdateTokenMetadataUpdateAuthorityInfo(parsedIx),
                    type: 'updateTokenMetadataUpdateAuthority',
                };
            }
            case Token2022Instruction.EmitTokenMetadata: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseEmitTokenMetadataInstruction(idata);
                return {
                    info: convertEmitTokenMetadataInfo(parsedIx),
                    type: 'emitTokenMetadata',
                };
            }
            case Token2022Instruction.InitializeMetadataPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeMetadataPointerInstruction(idata);
                return {
                    info: convertInitializeMetadataPointerInfo(parsedIx),
                    type: 'initializeMetadataPointer',
                };
            }
            case Token2022Instruction.UpdateMetadataPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateMetadataPointerInstruction(idata);
                return {
                    info: convertUpdateMetadataPointerInfo(parsedIx),
                    type: 'updateMetadataPointer',
                };
            }
            case Token2022Instruction.InitializeGroupPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeGroupPointerInstruction(idata);
                return {
                    info: convertInitializeGroupPointerInfo(parsedIx),
                    type: 'initializeGroupPointer',
                };
            }
            case Token2022Instruction.UpdateGroupPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateGroupPointerInstruction(idata);
                return {
                    info: convertUpdateGroupPointerInfo(parsedIx),
                    type: 'updateGroupPointer',
                };
            }
            case Token2022Instruction.InitializeGroupMemberPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeGroupMemberPointerInstruction(idata);
                return {
                    info: convertInitializeGroupMemberPointerInfo(parsedIx),
                    type: 'initializeGroupMemberPointer',
                };
            }
            case Token2022Instruction.UpdateGroupMemberPointer: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateGroupMemberPointerInstruction(idata);
                return {
                    info: convertUpdateGroupMemberPointerInfo(parsedIx),
                    type: 'updateGroupMemberPointer',
                };
            }
            case Token2022Instruction.InitializeTokenGroup: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeTokenGroupInstruction(idata);
                return {
                    info: convertInitializeTokenGroupInfo(parsedIx),
                    type: 'initializeTokenGroup',
                };
            }
            case Token2022Instruction.UpdateTokenGroupMaxSize: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateTokenGroupMaxSizeInstruction(idata);
                return {
                    info: convertUpdateTokenGroupMaxSizeInfo(parsedIx),
                    type: 'updateTokenGroupMaxSize',
                };
            }
            case Token2022Instruction.UpdateTokenGroupUpdateAuthority: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseUpdateTokenGroupUpdateAuthorityInstruction(idata);
                return {
                    info: convertUpdateTokenGroupUpdateAuthorityInfo(parsedIx),
                    type: 'updateTokenGroupUpdateAuthority',
                };
            }
            case Token2022Instruction.InitializeTokenGroupMember: {
                const idata = intoInstructionData(instruction);
                const parsedIx = parseInitializeTokenGroupMemberInstruction(idata);
                return {
                    info: convertInitializeTokenGroupMemberInfo(parsedIx),
                    type: 'initializeTokenGroupMember',
                };
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
}
