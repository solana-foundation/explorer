// Modelled on @codama/errors; WARNING: don't remove, change, or renumber error codes.
import type { IdlStandard } from './types.js';

export const IDL_ERROR__UNSUPPORTED_IDL_FORMAT = 1;
export const IDL_ERROR__IDL_FETCH_FAILED = 2;
export const IDL_ERROR__IDL_PARSE_FAILED = 3;
export const IDL_ERROR__IDL_ADDRESS_MISMATCH = 4;
export const IDL_ERROR__INSTRUCTION_DECODE_FAILED = 5;
export const IDL_ERROR__ACCOUNT_DECODE_FAILED = 6;
export const IDL_ERROR__MISSING_DECODE_HANDLER = 7;
export const IDL_ERROR__DECODE_UNIMPLEMENTED = 8;
export const IDL_ERROR__DECODE_KIND_MISMATCH = 9;
export const IDL_ERROR__IDL_NOT_FOUND = 10;
export const IDL_ERROR__PROGRAM_ADDRESS_REQUIRED = 11;

export type IdlErrorCode =
    | typeof IDL_ERROR__ACCOUNT_DECODE_FAILED
    | typeof IDL_ERROR__DECODE_KIND_MISMATCH
    | typeof IDL_ERROR__DECODE_UNIMPLEMENTED
    | typeof IDL_ERROR__IDL_ADDRESS_MISMATCH
    | typeof IDL_ERROR__IDL_FETCH_FAILED
    | typeof IDL_ERROR__IDL_NOT_FOUND
    | typeof IDL_ERROR__IDL_PARSE_FAILED
    | typeof IDL_ERROR__INSTRUCTION_DECODE_FAILED
    | typeof IDL_ERROR__MISSING_DECODE_HANDLER
    | typeof IDL_ERROR__PROGRAM_ADDRESS_REQUIRED
    | typeof IDL_ERROR__UNSUPPORTED_IDL_FORMAT;

type DefaultUnspecifiedErrorContextToUndefined<T> = {
    [P in IdlErrorCode]: P extends keyof T ? T[P] : undefined;
};

// WARNING: don't change or remove members of an error's context.
export type IdlErrorContext = DefaultUnspecifiedErrorContextToUndefined<{
    [IDL_ERROR__ACCOUNT_DECODE_FAILED]: { dataLength: number; standard: IdlStandard };
    [IDL_ERROR__DECODE_KIND_MISMATCH]: { expected: IdlStandard; received: string };
    [IDL_ERROR__DECODE_UNIMPLEMENTED]: { operation: string };
    [IDL_ERROR__IDL_ADDRESS_MISMATCH]: { declaredAddress: string; programAddress: string };
    [IDL_ERROR__IDL_NOT_FOUND]: { programAddress: string };
    [IDL_ERROR__IDL_PARSE_FAILED]: { operation: string };
    [IDL_ERROR__INSTRUCTION_DECODE_FAILED]: { programAddress: string; standard: IdlStandard };
    [IDL_ERROR__MISSING_DECODE_HANDLER]: { kind: string };
    [IDL_ERROR__PROGRAM_ADDRESS_REQUIRED]: { programName?: string };
}>;

const IDL_ERROR_MESSAGES: Readonly<{ [P in IdlErrorCode]: (context: IdlErrorContext[P]) => string }> = {
    [IDL_ERROR__ACCOUNT_DECODE_FAILED]: c =>
        `could not decode account data (${c.dataLength} bytes) with the ${c.standard} IDL`,
    [IDL_ERROR__DECODE_KIND_MISMATCH]: c => `expected the ${c.expected} decode arm, got '${c.received}'`,
    [IDL_ERROR__DECODE_UNIMPLEMENTED]: c => `${c.operation} is not implemented`,
    [IDL_ERROR__IDL_ADDRESS_MISMATCH]: c =>
        `IDL program ${c.declaredAddress} does not match program ${c.programAddress}`,
    [IDL_ERROR__IDL_FETCH_FAILED]: () => 'failed to fetch the program IDL',
    [IDL_ERROR__IDL_NOT_FOUND]: c => `no IDL found on-chain for program ${c.programAddress}`,
    [IDL_ERROR__IDL_PARSE_FAILED]: c => `failed to parse the program IDL (${c.operation})`,
    [IDL_ERROR__INSTRUCTION_DECODE_FAILED]: c =>
        `could not decode instruction data for program ${c.programAddress} with the ${c.standard} IDL`,
    [IDL_ERROR__MISSING_DECODE_HANDLER]: c => `no handler declared for decode kind '${c.kind}'`,
    [IDL_ERROR__PROGRAM_ADDRESS_REQUIRED]: c =>
        `the legacy IDL${c.programName ? ` for ${c.programName}` : ''} declares no program address — pass options.programAddress`,
    [IDL_ERROR__UNSUPPORTED_IDL_FORMAT]: () => 'IDL is neither a Codama root node nor a modern (>= 0.30) Anchor IDL',
};

export function getIdlErrorMessage<TCode extends IdlErrorCode>(code: TCode, context: IdlErrorContext[TCode]): string {
    return IDL_ERROR_MESSAGES[code](context);
}

/** Typed error family of the package — logger-agnostic; consumers map codes to their own severities. */
export class IdlError<TCode extends IdlErrorCode = IdlErrorCode> extends Error {
    readonly code: TCode;
    readonly context: IdlErrorContext[TCode];

    // Context is required exactly when the code declares one; `cause` may ride along with it.
    constructor(
        ...[code, contextAndErrorOptions]: IdlErrorContext[TCode] extends undefined
            ? [code: TCode, errorOptions?: ErrorOptions]
            : [code: TCode, contextAndErrorOptions: ErrorOptions & IdlErrorContext[TCode]]
    ) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the overloaded tuple already correlates the context to the code; TS cannot re-prove it on the unresolved generic (same plumbing as @codama/errors)
        const context = contextAndErrorOptions as IdlErrorContext[TCode];
        const cause =
            contextAndErrorOptions && 'cause' in contextAndErrorOptions ? contextAndErrorOptions.cause : undefined;
        super(getIdlErrorMessage(code, context), cause === undefined ? undefined : { cause });
        this.name = 'IdlError';
        this.code = code;
        this.context = context;
    }
}

export function isIdlError<TCode extends IdlErrorCode = IdlErrorCode>(e: unknown, code?: TCode): e is IdlError<TCode> {
    return e instanceof IdlError && (code === undefined || e.code === code);
}

/** Error-first result tuple for single-attempt operations on untrusted input. */
export type Result<T, TCode extends IdlErrorCode = IdlErrorCode> =
    | readonly [IdlError<TCode>, undefined]
    | readonly [undefined, T];

export const ok = <T>(value: T): Result<T, never> => [undefined, value];
export const err = <TCode extends IdlErrorCode>(error: IdlError<TCode>): Result<never, TCode> => [error, undefined];
