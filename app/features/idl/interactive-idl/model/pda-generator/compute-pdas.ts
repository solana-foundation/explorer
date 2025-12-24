import type { InstructionData, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';
import type { DeepPartial } from 'react-hook-form';

import type { InstructionFormData } from '../use-instruction-form';
import { createAnchorPdaProvider } from './anchor-provider';
import { createPdaProviderRegistry } from './registry';
import { buildSeedsWithInfo } from './seed-builder';

const defaultRegistry = createPdaProviderRegistry();
defaultRegistry.register(createAnchorPdaProvider());

export interface PdaGenerationResult {
    generated: string | null;
    seeds: { value: string | null; name: string }[];
}

/**
 * Computes PDA addresses for accounts that have PDA seeds defined.
 * Returns a map of account names (camelCase) to their computed PDA data.
 */
export function computePdas(
    idl: SupportedIdl | undefined,
    instruction: InstructionData,
    formValues: DeepPartial<InstructionFormData>
): Record<string, PdaGenerationResult> {
    if (!idl) {
        return {};
    }

    const provider = defaultRegistry.findProvider(idl);
    if (!provider) {
        return {};
    }

    const programId = provider.getProgramId(idl);
    if (!programId) {
        return {};
    }

    const idlInstruction = provider.findInstruction(idl, instruction.name);
    if (!idlInstruction) {
        return {};
    }

    const args = formValues.arguments?.[instruction.name] || {};
    const accounts = formValues.accounts?.[instruction.name] || {};
    const pdaAddresses: Record<string, PdaGenerationResult> = {};

    for (const account of idlInstruction.accounts) {
        if (!account.pda) {
            continue;
        }

        const camelName = camelCase(account.name);

        try {
            const { buffers: seedBuffers, info: seedInfo } = buildSeedsWithInfo(
                account.pda.seeds,
                args,
                accounts,
                idlInstruction
            );

            if (seedBuffers) {
                const [pda] = PublicKey.findProgramAddressSync(seedBuffers, programId);
                pdaAddresses[camelName] = {
                    generated: pda.toBase58(),
                    seeds: seedInfo,
                };
            } else {
                pdaAddresses[camelName] = {
                    generated: null,
                    seeds: seedInfo,
                };
            }
        } catch {
            const { info: seedInfo } = buildSeedsWithInfo(account.pda.seeds, args, accounts, idlInstruction);
            pdaAddresses[camelName] = {
                generated: null,
                seeds: seedInfo,
            };
        }
    }

    return pdaAddresses;
}
