import type { InstructionData, SupportedIdl } from '@entities/idl';
import type { DeepPartial } from 'react-hook-form';

import type { InstructionFormData } from '../use-instruction-form';
import { createAnchorPdaProvider } from './anchor-provider';
import { createCodamaPdaProvider } from './codama-provider';
import { createPdaProviderRegistry } from './registry';
import type { PdaGenerationResult } from './types';

const defaultRegistry = createPdaProviderRegistry();
defaultRegistry.register(createAnchorPdaProvider());
defaultRegistry.register(createCodamaPdaProvider());

/**
 * Computes PDA addresses for accounts that have PDA seeds defined.
 * Returns a map of account names (camelCase) to their computed PDA data.
 *
 * Delegates to the matching provider's `computePdas` method.
 */
export async function computePdas(
    idl: SupportedIdl | undefined,
    instruction: InstructionData,
    formValues: DeepPartial<InstructionFormData>,
): Promise<Record<string, PdaGenerationResult>> {
    if (!idl || !instruction) {
        return {};
    }

    const provider = defaultRegistry.findProvider(idl);
    if (!provider) {
        return {};
    }

    const args = formValues.arguments?.[instruction.name] || {};
    const accounts = formValues.accounts?.[instruction.name] || {};

    return provider.computePdas(
        idl,
        instruction.name,
        args as Record<string, string | undefined>,
        accounts as Record<string, string | Record<string, string | undefined> | undefined>,
    );
}
