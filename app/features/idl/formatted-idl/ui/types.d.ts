import type { FormattedIdl, IdlSource } from '@entities/idl';

export type StandardFormattedIdlProps<T> = {
    idl?: T;
    source: IdlSource;
    programId: string;
    searchStr?: string;
};

export type FormattedIdlViewProps<T> = {
    idl: FormattedIdl | null;
    originalIdl: T;
    source: IdlSource;
    programId?: string;
    searchStr?: string;
};

export type IdlDataKeys = keyof FormattedIdl;

export interface FormattedIdlDataView<K extends IdlDataKeys> {
    data: FormattedIdl[K];
}
