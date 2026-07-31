import { isParsedInstructionProgram, type ParserProgramLabel } from '@explorer/parsers';
import { type ParsedInstruction } from '@solana/web3.js';
import {
    AssociatedTokenInstruction,
    CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR,
    identifyAssociatedTokenInstruction,
    parseCreateAssociatedTokenIdempotentInstruction,
    parseCreateAssociatedTokenInstruction,
    parseRecoverNestedAssociatedTokenInstruction,
} from '@solana-program/token';
import { create } from 'superstruct';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import type { KitInstruction } from '@/app/shared/lib/web3js-compat';

import { CreateAccountsInfo, RecoverNestedInfo } from './types';

/** RPC `parsed.program` discriminator for the Associated Token program; also the slice's `programLabel`. */
export const ASSOCIATED_TOKEN_PROGRAM_LABEL = 'spl-associated-token-account' satisfies ParserProgramLabel;

/**
 * Canonical shape for a parsed Associated Token instruction.
 *
 * Both entry points below produce this same shape, so consumers never need to
 * know which one ran. `parseAssociatedTokenInstruction` decodes raw bytes (the
 * inspector) and `parseAssociatedTokenRpcInstruction` normalises an
 * RPC-pre-parsed instruction (the transaction page).
 */
export type AssociatedTokenParsed =
    | { type: 'create'; info: CreateAccountsInfo }
    | { type: 'createIdempotent'; info: CreateAccountsInfo }
    | { type: 'recoverNested'; info: RecoverNestedInfo };

export function parseAssociatedTokenInstruction(ix: KitInstruction): AssociatedTokenParsed | undefined {
    try {
        const data = effectiveInstructionData(ix.data);
        const idata = { ...ix, data };

        switch (identifyAssociatedTokenInstruction(data)) {
            case AssociatedTokenInstruction.CreateAssociatedToken:
                return {
                    info: toCreateAccountsInfo(parseCreateAssociatedTokenInstruction(idata).accounts),
                    type: 'create',
                };
            case AssociatedTokenInstruction.CreateAssociatedTokenIdempotent:
                return {
                    info: toCreateAccountsInfo(parseCreateAssociatedTokenIdempotentInstruction(idata).accounts),
                    type: 'createIdempotent',
                };
            case AssociatedTokenInstruction.RecoverNestedAssociatedToken:
                return {
                    info: toRecoverNestedInfo(parseRecoverNestedAssociatedTokenInstruction(idata).accounts),
                    type: 'recoverNested',
                };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/** Normalise an RPC-pre-parsed Associated Token instruction into `AssociatedTokenParsed`. */
export function parseAssociatedTokenRpcInstruction(ix: ParsedInstruction): AssociatedTokenParsed | undefined {
    if (!isParsedInstructionProgram(ix, ASSOCIATED_TOKEN_PROGRAM_LABEL)) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'create':
                return { info: create(ix.parsed.info, CreateAccountsInfo), type: 'create' };
            case 'createIdempotent':
                return { info: create(ix.parsed.info, CreateAccountsInfo), type: 'createIdempotent' };
            case 'recoverNested':
                return { info: create(ix.parsed.info, RecoverNestedInfo), type: 'recoverNested' };
            default:
                return undefined;
        }
    } catch (error) {
        // The program label already matched, so a validation failure here means
        // the RPC sent a payload we don't model — worth surfacing. Returning
        // undefined makes the dispatcher fall back to the unknown-instruction card.
        Logger.error(error, { instructionType: ix.parsed.type, program: ix.program });
        return undefined;
    }
}

/** A kit `AccountMeta`, narrowed to the one field the mappers below read. */
type KitAccount = { address: string };

/**
 * Map the kit decoder's account names onto the canonical RPC names. Running the
 * result through the same validator the RPC path uses keeps both paths' output
 * byte-for-byte comparable.
 */
function toCreateAccountsInfo(accounts: {
    ata: KitAccount;
    mint: KitAccount;
    owner: KitAccount;
    payer: KitAccount;
    systemProgram: KitAccount;
    tokenProgram: KitAccount;
}): CreateAccountsInfo {
    return create(
        {
            account: accounts.ata.address,
            mint: accounts.mint.address,
            source: accounts.payer.address,
            systemProgram: accounts.systemProgram.address,
            tokenProgram: accounts.tokenProgram.address,
            wallet: accounts.owner.address,
        },
        CreateAccountsInfo,
    );
}

/**
 * `nestedOwner` is the *owner associated token account*, not the wallet — the
 * naming mismatch is inherited from the RPC parser and preserved here so the
 * two decode paths agree.
 */
function toRecoverNestedInfo(accounts: {
    destinationAssociatedAccountAddress: KitAccount;
    nestedAssociatedAccountAddress: KitAccount;
    nestedTokenMintAddress: KitAccount;
    ownerAssociatedAccountAddress: KitAccount;
    ownerTokenMintAddress: KitAccount;
    tokenProgram: KitAccount;
    walletAddress: KitAccount;
}): RecoverNestedInfo {
    return create(
        {
            destination: accounts.destinationAssociatedAccountAddress.address,
            nestedMint: accounts.nestedTokenMintAddress.address,
            nestedOwner: accounts.ownerAssociatedAccountAddress.address,
            nestedSource: accounts.nestedAssociatedAccountAddress.address,
            ownerMint: accounts.ownerTokenMintAddress.address,
            tokenProgram: accounts.tokenProgram.address,
            wallet: accounts.walletAddress.address,
        },
        RecoverNestedInfo,
    );
}

/**
 * Some clients send the AT Create instruction with empty data instead of the
 * single-byte discriminator. Reconstruct the canonical discriminator byte so
 * `identifyAssociatedTokenInstruction` can recognise it. The original data is
 * left untouched.
 */
function effectiveInstructionData(data: Uint8Array): Uint8Array {
    if (data.length === 0) {
        return bytes([CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR]);
    }
    return data;
}
