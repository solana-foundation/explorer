import type { Idl } from '@coral-xyz/anchor/dist/cjs/idl';
import type { FormattedIdl, InstructionData } from '@entities/idl';
import { useFormatAnchorIdl, useFormatCodamaIdl } from '@entities/idl';
import { getIdlSpecType } from '@entities/idl/model/converters/convert-legacy-idl';
import { renderHook } from '@testing-library/react';
import { camelCase } from 'change-case';

export function formatIdlForTest(idl: unknown): FormattedIdl | null {
    if (getIdlSpecType(idl) === 'codama') {
        const { result } = renderHook(() => useFormatCodamaIdl(idl));
        return result.current;
    }
    const { result } = renderHook(() => useFormatAnchorIdl(idl as Idl));
    return result.current;
}

export function findInstruction(idl: unknown, name: string): InstructionData | undefined {
    const formatted = formatIdlForTest(idl);
    return formatted?.instructions?.find(i => i.name === camelCase(name));
}
