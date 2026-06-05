import { getTokenIxValidator } from '@components/instruction/token/types';
import { unwrapOption } from '@solana/kit';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
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
import { create } from 'superstruct';

import type { KitInstruction } from '@/app/shared/lib/web3js-compat';
import type { ParserProgramLabel } from '@/app/utils/programs';

/** RPC `parsed.program` discriminator for the Token-2022 program; also the slice's `programLabel`. */
export const TOKEN_2022_PROGRAM_LABEL = 'spl-token-2022' satisfies ParserProgramLabel;

/**
 * Canonical shape of a parsed Token-2022 instruction. Same shape as the SPL
 * Token slice's `TokenParsed` — both use the SPL token validator map for
 * RPC normalisation. `type` is a free-form string for the same reasons as
 * `TokenParsed`.
 */
export type Token2022Parsed = { type: string; info: unknown };

export function parseToken2022Instruction(ix: KitInstruction): Token2022Parsed | undefined {
    try {
        const instructionType = identifyToken2022Instruction(ix.data);

        switch (instructionType) {
            case Token2022Instruction.InitializeTokenMetadata: {
                const parsed = parseInitializeTokenMetadataInstruction(ix);
                return {
                    info: {
                        metadata: new PublicKey(parsed.accounts.metadata.address),
                        mint: new PublicKey(parsed.accounts.mint.address),
                        mintAuthority: new PublicKey(parsed.accounts.mintAuthority.address),
                        name: parsed.data.name,
                        symbol: parsed.data.symbol,
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                        uri: parsed.data.uri,
                    },
                    type: 'initializeTokenMetadata',
                };
            }
            case Token2022Instruction.UpdateTokenMetadataField: {
                const parsed = parseUpdateTokenMetadataFieldInstruction(ix);
                return {
                    info: {
                        field: tokenMetadataFieldToString(parsed.data.field),
                        metadata: new PublicKey(parsed.accounts.metadata.address),
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                        value: parsed.data.value,
                    },
                    type: 'updateTokenMetadataField',
                };
            }
            case Token2022Instruction.RemoveTokenMetadataKey: {
                const parsed = parseRemoveTokenMetadataKeyInstruction(ix);
                return {
                    info: {
                        idempotent: parsed.data.idempotent,
                        key: parsed.data.key,
                        metadata: new PublicKey(parsed.accounts.metadata.address),
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                    },
                    type: 'removeTokenMetadataKey',
                };
            }
            case Token2022Instruction.UpdateTokenMetadataUpdateAuthority: {
                const parsed = parseUpdateTokenMetadataUpdateAuthorityInstruction(ix);
                return {
                    info: {
                        metadata: new PublicKey(parsed.accounts.metadata.address),
                        newUpdateAuthority: new PublicKey(parsed.data.newUpdateAuthority),
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                    },
                    type: 'updateTokenMetadataUpdateAuthority',
                };
            }
            case Token2022Instruction.EmitTokenMetadata: {
                const parsed = parseEmitTokenMetadataInstruction(ix);
                const end = unwrapOption(parsed.data.end);
                const start = unwrapOption(parsed.data.start);
                return {
                    info: {
                        end: end !== null ? safeNumber(end) : undefined,
                        metadata: new PublicKey(parsed.accounts.metadata.address),
                        start: start !== null ? safeNumber(start) : undefined,
                    },
                    type: 'emitTokenMetadata',
                };
            }
            case Token2022Instruction.InitializeMetadataPointer: {
                const parsed = parseInitializeMetadataPointerInstruction(ix);
                const authority = unwrapOption(parsed.data.authority);
                const metadataAddress = unwrapOption(parsed.data.metadataAddress);
                return {
                    info: {
                        authority: authority !== null ? new PublicKey(authority) : undefined,
                        metadataAddress: metadataAddress !== null ? new PublicKey(metadataAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'initializeMetadataPointer',
                };
            }
            case Token2022Instruction.UpdateMetadataPointer: {
                const parsed = parseUpdateMetadataPointerInstruction(ix);
                const metadataAddress = unwrapOption(parsed.data.metadataAddress);
                return {
                    info: {
                        authority: new PublicKey(parsed.accounts.metadataPointerAuthority.address),
                        metadataAddress: metadataAddress !== null ? new PublicKey(metadataAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'updateMetadataPointer',
                };
            }
            case Token2022Instruction.InitializeGroupPointer: {
                const parsed = parseInitializeGroupPointerInstruction(ix);
                const authority = unwrapOption(parsed.data.authority);
                const groupAddress = unwrapOption(parsed.data.groupAddress);
                return {
                    info: {
                        authority: authority !== null ? new PublicKey(authority) : undefined,
                        groupAddress: groupAddress !== null ? new PublicKey(groupAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'initializeGroupPointer',
                };
            }
            case Token2022Instruction.UpdateGroupPointer: {
                const parsed = parseUpdateGroupPointerInstruction(ix);
                const groupAddress = unwrapOption(parsed.data.groupAddress);
                return {
                    info: {
                        authority: new PublicKey(parsed.accounts.groupPointerAuthority.address),
                        groupAddress: groupAddress !== null ? new PublicKey(groupAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'updateGroupPointer',
                };
            }
            case Token2022Instruction.InitializeGroupMemberPointer: {
                const parsed = parseInitializeGroupMemberPointerInstruction(ix);
                const authority = unwrapOption(parsed.data.authority);
                const memberAddress = unwrapOption(parsed.data.memberAddress);
                return {
                    info: {
                        authority: authority !== null ? new PublicKey(authority) : undefined,
                        memberAddress: memberAddress !== null ? new PublicKey(memberAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'initializeGroupMemberPointer',
                };
            }
            case Token2022Instruction.UpdateGroupMemberPointer: {
                const parsed = parseUpdateGroupMemberPointerInstruction(ix);
                const memberAddress = unwrapOption(parsed.data.memberAddress);
                return {
                    info: {
                        authority: new PublicKey(parsed.accounts.groupMemberPointerAuthority.address),
                        memberAddress: memberAddress !== null ? new PublicKey(memberAddress) : undefined,
                        mint: new PublicKey(parsed.accounts.mint.address),
                    },
                    type: 'updateGroupMemberPointer',
                };
            }
            case Token2022Instruction.InitializeTokenGroup: {
                const parsed = parseInitializeTokenGroupInstruction(ix);
                return {
                    info: {
                        group: new PublicKey(parsed.accounts.group.address),
                        maxSize: parsed.data.maxSize,
                        mint: new PublicKey(parsed.accounts.mint.address),
                        mintAuthority: new PublicKey(parsed.accounts.mintAuthority.address),
                        updateAuthority: new PublicKey(parsed.data.updateAuthority),
                    },
                    type: 'initializeTokenGroup',
                };
            }
            case Token2022Instruction.UpdateTokenGroupMaxSize: {
                const parsed = parseUpdateTokenGroupMaxSizeInstruction(ix);
                return {
                    info: {
                        group: new PublicKey(parsed.accounts.group.address),
                        maxSize: parsed.data.maxSize,
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                    },
                    type: 'updateTokenGroupMaxSize',
                };
            }
            case Token2022Instruction.UpdateTokenGroupUpdateAuthority: {
                const parsed = parseUpdateTokenGroupUpdateAuthorityInstruction(ix);
                return {
                    info: {
                        group: new PublicKey(parsed.accounts.group.address),
                        newUpdateAuthority: new PublicKey(parsed.data.newUpdateAuthority),
                        updateAuthority: new PublicKey(parsed.accounts.updateAuthority.address),
                    },
                    type: 'updateTokenGroupUpdateAuthority',
                };
            }
            case Token2022Instruction.InitializeTokenGroupMember: {
                const parsed = parseInitializeTokenGroupMemberInstruction(ix);
                return {
                    info: {
                        group: new PublicKey(parsed.accounts.group.address),
                        groupUpdateAuthority: new PublicKey(parsed.accounts.groupUpdateAuthority.address),
                        member: new PublicKey(parsed.accounts.member.address),
                        memberMint: new PublicKey(parsed.accounts.memberMint.address),
                        memberMintAuthority: new PublicKey(parsed.accounts.memberMintAuthority.address),
                    },
                    type: 'initializeTokenGroupMember',
                };
            }
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Token-2022 metadata fields are tagged unions: Name/Symbol/Uri map to lowercase
 * tag names; a custom Key field carries the user-defined key string in fields[0].
 */
function tokenMetadataFieldToString(field: { __kind: string; fields?: readonly [string] }): string {
    return field.fields?.[0] ?? field.__kind.toLowerCase();
}

/**
 * Normalise an RPC-pre-parsed Token-2022 ParsedInstruction. SPL Token and
 * Token-2022 share `IX_STRUCTS` for validation; only the program label differs.
 */
export function parseToken2022RpcInstruction(ix: ParsedInstruction): Token2022Parsed | undefined {
    if (ix.program !== TOKEN_2022_PROGRAM_LABEL) return undefined;
    const validator = getTokenIxValidator(ix.parsed.type);
    if (!validator) return undefined;
    try {
        return { info: create(ix.parsed.info, validator), type: ix.parsed.type };
    } catch {
        return undefined;
    }
}

function safeNumber(value: bigint | number): number {
    return typeof value === 'bigint' ? Number(value) : value;
}
