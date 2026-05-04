import type { IdlInstruction, IdlInstructionAccountItem, IdlPda } from '@coral-xyz/anchor/dist/cjs/idl';
import type { AnchorIdl, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';

import { resolveProgramId } from './program-resolver';
import { buildSeedsWithInfo } from './seed-builder';
import type { PdaAccount, PdaGenerationResult, PdaInstruction, PdaProvider } from './types';

/**
 * PDA provider for Anchor IDL format
 */
export function createAnchorPdaProvider(): PdaProvider {
    return {
        canHandle,
        computePdas,
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

async function computePdas(
    idl: SupportedIdl,
    instructionName: string,
    args: Record<string, string | undefined>,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
): Promise<Record<string, PdaGenerationResult>> {
    const programId = getProgramId(idl);
    if (!programId) return {};

    const instruction = findInstruction(idl, instructionName);
    if (!instruction) return {};

    const pdaAddresses: Record<string, PdaGenerationResult> = {};

    for (const account of instruction.accounts) {
        if (!account.pda) continue;
        if (typeof account.pda === 'boolean' || !account.pda.seeds) continue;

        const camelName = camelCase(account.name);

        try {
            const { buffers: seedBuffers, info: seedInfo } = buildSeedsWithInfo(
                account.pda.seeds,
                args,
                accounts,
                instruction,
            );

            const derivationProgramId = resolveProgramId(programId, account.pda.program, { accounts, args });

            if (seedBuffers && derivationProgramId) {
                const [pda] = PublicKey.findProgramAddressSync(seedBuffers, derivationProgramId);
                pdaAddresses[camelName] = { generated: pda.toBase58(), seeds: seedInfo };
            } else {
                pdaAddresses[camelName] = { generated: null, seeds: seedInfo };
            }
        } catch {
            const { info: seedInfo } = buildSeedsWithInfo(account.pda.seeds, args, accounts, instruction);
            pdaAddresses[camelName] = { generated: null, seeds: seedInfo };
        }
    }

    return pdaAddresses;
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
