import type { InstructionData, SupportedIdl } from '@entities/idl';
import { type Control, useWatch } from 'react-hook-form';

import { computePdas } from './pda-generator/compute-pdas';
import type { InstructionFormData } from './use-instruction-form';

export function usePdas({
    idl,
    instruction,
    form,
}: {
    idl: SupportedIdl | undefined;
    instruction: InstructionData;
    form: { control: Control<InstructionFormData> };
}) {
    const formValues = useWatch({ control: form.control });

    return computePdas(idl, instruction, formValues);
}
