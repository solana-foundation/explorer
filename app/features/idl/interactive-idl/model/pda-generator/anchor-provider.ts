import type { IdlInstruction, IdlInstructionAccountItem, IdlPda } from '@coral-xyz/anchor/dist/cjs/idl';
import type { AnchorIdl, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';

import type { PdaAccount, PdaInstruction, PdaProvider } from './types';

/**
 * PDA provider for Anchor IDL format
 */
export function createAnchorPdaProvider(): PdaProvider {
    return {
        canHandle,
        findInstruction,
        getProgramId,
        name: 'anchor',
    };
}

function mapAccounts(accounts: IdlInstruction['accounts']): PdaAccount[] {
    return accounts
        .filter(acc => !('accounts' in acc)) // Skip nested account groups
        .map(acc => ({
            name: acc.name,
            pda: getPda(acc),
        }));
}

function getPda(acc: IdlInstructionAccountItem): IdlPda | undefined {
    if ('accounts' in acc) return undefined;
    return acc.pda;
}

function canHandle(idl: SupportedIdl): boolean {
    return 'instructions' in idl && 'address' in idl;
}

function getProgramId(idl: SupportedIdl): PublicKey | null {
    const anchorIdl = idl as AnchorIdl;
    return anchorIdl.address ? new PublicKey(anchorIdl.address) : null;
}

function findInstruction(idl: SupportedIdl, instructionName: string): PdaInstruction | null {
    const anchorIdl = idl as AnchorIdl;
    const idlInstruction = anchorIdl.instructions.find(ix => camelCase(ix.name) === instructionName);

    if (!idlInstruction) {
        return null;
    }

    return {
        accounts: mapAccounts(idlInstruction.accounts),
        args: idlInstruction.args,
        name: idlInstruction.name,
    };
}
