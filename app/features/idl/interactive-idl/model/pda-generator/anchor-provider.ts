import type { IdlInstruction, IdlSeed } from '@coral-xyz/anchor/dist/cjs/idl';
import type { AnchorIdl, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';

import type { PdaAccount, PdaArgument, PdaInstruction, PdaProvider, PdaSeed } from './types';

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
            pda: 'pda' in acc && acc.pda ? { seeds: mapSeeds(acc.pda.seeds) } : undefined,
        }));
}

function mapSeeds(seeds: IdlSeed[]): PdaSeed[] {
    return seeds.map(seed => {
        if (seed.kind === 'const') {
            return { kind: 'const', value: seed.value };
        }
        return {
            kind: seed.kind,
            path: seed.path,
        };
    });
}

function mapArgs(args: IdlInstruction['args']): PdaArgument[] {
    return args.map(arg => ({
        name: arg.name,
        type: typeof arg.type === 'string' ? arg.type : 'unknown',
    }));
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
        args: mapArgs(idlInstruction.args),
        name: idlInstruction.name,
    };
}
