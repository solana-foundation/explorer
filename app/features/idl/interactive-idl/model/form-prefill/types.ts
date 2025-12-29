import type { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { UseFormReturn } from 'react-hook-form';

import type { InstructionFormData } from '../use-instruction-form';

export type ArgumentType = Extract<IdlType, string>;

/**
 * External dependency that triggers automatic field filling when it changes.
 * Examples: wallet connection, cluster change, program change
 */
export type ExternalDependency<TValue = unknown> = {
    id: string;
    getValue: () => TValue | null | undefined;
    onValueChange: (value: unknown, form: UseFormReturn<InstructionFormData>) => void;
    /**
     * If true, this dependency will be triggered when form values change.
     * Useful for dependencies that need to react to form input (e.g., PDA prefill).
     */
    watchesFormValues?: boolean;
};

export type PrefillConfig = {
    externalDependencies?: ExternalDependency<unknown>[];
};

export type UseFormPrefillOptions = {
    form: UseFormReturn<InstructionFormData>;
    config: PrefillConfig;
};
