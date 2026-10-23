import { Idl } from '@coral-xyz/anchor';

export function formatSerdeIdl(idl: NonNullable<object>, _programAddress?: string): Idl {
    return idl as Idl;
}
