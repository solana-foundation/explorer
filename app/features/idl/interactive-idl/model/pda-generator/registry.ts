import type { SupportedIdl } from '@entities/idl';

import type { PdaProvider } from './types';

export type PdaProviderRegistry = {
    register: (provider: PdaProvider) => void;
    findProvider: (idl: SupportedIdl) => PdaProvider | null;
    getAllProviders: () => readonly PdaProvider[];
};

export function createPdaProviderRegistry(): PdaProviderRegistry {
    const providers: PdaProvider[] = [];

    return {
        /**
         * Find the first provider that can handle the given IDL
         * Returns null if no provider can handle it
         */
        findProvider(idl: SupportedIdl): PdaProvider | null {
            return providers.find(provider => provider.canHandle(idl)) || null;
        },

        /**
         * Get all registered providers
         */
        getAllProviders(): readonly PdaProvider[] {
            return providers;
        },

        /**
         * Register a new provider
         * Providers are checked in registration order
         */
        register(provider: PdaProvider): void {
            providers.push(provider);
        },
    };
}
