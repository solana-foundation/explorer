import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import type { UseFormPrefillOptions } from './types';

/**
 * Hook that manages form prefill logic:
 * - Watches external dependencies and auto-fills fields when they change
 * - Watches form values for dependencies that need to react to form changes (e.g., PDAs)
 */
export function useFormPrefill({ form, config }: UseFormPrefillOptions): void {
    const externalDependencyRefs = useRef<Map<string, unknown>>(new Map());
    const formValues = useWatch({ control: form.control });

    useEffect(() => {
        if (!config.externalDependencies || config.externalDependencies.length === 0) {
            return;
        }

        for (const dependency of config.externalDependencies) {
            const currentValue = dependency.getValue();
            const previousValue = externalDependencyRefs.current.get(dependency.id);

            if (currentValue !== previousValue) {
                externalDependencyRefs.current.set(dependency.id, currentValue);
                dependency.onValueChange(currentValue, form);
            }

            if (dependency.watchesFormValues) {
                dependency.onValueChange(currentValue, form);
            }
        }
    }, [config.externalDependencies, form, formValues]);
}
