import type { InstructionData, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';
import { type Control, useWatch } from 'react-hook-form';

import { createAnchorPdaProvider } from './pda-generator/anchor-provider';
import { createPdaProviderRegistry } from './pda-generator/registry';
import { buildSeeds } from './pda-generator/seed-builder';
import type { InstructionFormData } from './use-instruction-form';

const defaultRegistry = createPdaProviderRegistry();
defaultRegistry.register(createAnchorPdaProvider());

export function useGeneratedPdas({
    idl,
    instruction,
    form,
}: {
    idl: SupportedIdl | undefined;
    instruction: InstructionData;
    form: { control: Control<InstructionFormData> };
}) {
    const formValues = useWatch({ control: form.control });

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
    const pdaAddresses: Record<string, string | null> = {};

    for (const account of idlInstruction.accounts) {
        if (!account.pda) {
            continue;
        }

        const camelName = camelCase(account.name);

        try {
            const seeds = buildSeeds(account.pda.seeds, args, accounts, idlInstruction);
            if (seeds) {
                const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
                pdaAddresses[camelName] = pda.toBase58();
            } else {
                pdaAddresses[camelName] = null;
            }
        } catch {
            pdaAddresses[camelName] = null;
        }
    }

    return pdaAddresses;
}
