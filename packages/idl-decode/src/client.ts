import type { Instruction, ReadonlyUint8Array } from '@solana/kit';

import { convertToCodama } from './anchor/convert.js';
import { codamaProvider } from './codama/index.js';
import {
    getIdlProgramAddress,
    getIdlProgramVersion,
    getIdlStandard,
    getIdlVersion,
    isAnchorIdl,
    isCodamaIdl,
    isLegacyAnchorIdl,
    isSupportedIdl,
} from './detect/index.js';
import {
    err,
    IDL_ERROR__ACCOUNT_DECODE_FAILED,
    IDL_ERROR__DECODE_KIND_MISMATCH,
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_PARSE_FAILED,
    IDL_ERROR__INSTRUCTION_DECODE_FAILED,
    IDL_ERROR__MISSING_DECODE_HANDLER,
    IDL_ERROR__PROGRAM_ADDRESS_REQUIRED,
    IDL_ERROR__UNSUPPORTED_IDL_FORMAT,
    IdlError,
    isIdlError,
    ok,
    type Result,
} from './errors.js';
import type { AccountDataOf, InstructionDataOf } from './infer/index.js';
import { buildInstructionNameTable, buildProgramName, matchInstructionName } from './names/index.js';
import {
    type AccountDecode,
    type AccountDecodeFor,
    type AccountHandlers,
    type AnchorIdl,
    type AnchorV00Idl,
    type CodamaIdl,
    type FallbackDecoderOptions,
    type IdlDecodeProvider,
    IdlStandard,
    type InstructionDecode,
    type InstructionDecodeFor,
    type InstructionHandlers,
    type IdlVersion,
    type SupportedIdl,
    type SupportedIdlInput,
} from './types.js';

export type IdlClientOptions = FallbackDecoderOptions & {
    /** Decode engine — the codama engine by default; pass one to swap. */
    provider?: IdlDecodeProvider;
    /** For legacy (pre-0.30) input whose IDL declares no address — injected into the converted root. */
    programAddress?: string;
};

/** Options of the names-only client — only the legacy address injection applies (no decode engine). */
export type IdlMetaClientOptions = {
    /** For legacy (pre-0.30) input whose IDL declares no address — injected into the converted root. */
    programAddress?: string;
};

type LegacyNormalizeErrorCode = typeof IDL_ERROR__IDL_PARSE_FAILED | typeof IDL_ERROR__PROGRAM_ADDRESS_REQUIRED;

/** Every code the untrusted create routes can return: unsupported format, plus the legacy route's conversion failure / missing address. */
export type TryCreateIdlErrorCode = LegacyNormalizeErrorCode | typeof IDL_ERROR__UNSUPPORTED_IDL_FORMAT;

/** Convert a legacy IDL and resolve its program address — the client contract requires one. */
function tryNormalizeLegacyIdl(
    idl: AnchorV00Idl,
    programAddress?: string,
): Result<CodamaIdl, LegacyNormalizeErrorCode> {
    const [error, root] = convertToCodama(idl);
    if (error) return err(error);
    if (root.program.publicKey) return ok(root);
    if (!programAddress) return err(new IdlError(IDL_ERROR__PROGRAM_ADDRESS_REQUIRED, { programName: idl.name }));
    // codama nodes are frozen — spread-copy to inject the address
    // eslint-disable-next-line typescript/consistent-type-assertions -- the spread keeps the RootNode shape; only publicKey changes
    return ok({ ...root, program: { ...root.program, publicKey: programAddress } } as CodamaIdl);
}

/** Engine-free client over one IDL — names and metadata only, no decode surface (see {@link createIdlMetaClient}). */
export type IdlMetaClient<T extends SupportedIdlInput = SupportedIdl> = {
    readonly idl: T;
    programAddress(): string | undefined;
    programName(): string | undefined;
    /** The program's own semver, when the IDL carries one — distinct from the format version. */
    programVersion(): string | undefined;
    /** The IDL's format version: the Codama root `version`, or Anchor's `metadata.spec`. */
    formatVersion(): IdlVersion;
    instructionName(data: ReadonlyUint8Array): string | undefined;
};

/**
 * Parsed-data client over one IDL — decode results narrow statically to the IDL's standard, and
 * payload types derive from the IDL type (literal IDLs infer; wide runtime IDLs give `unknown`).
 */
export type IdlClient<T extends SupportedIdlInput = SupportedIdl> = IdlMetaClient<T> & {
    /**
     * Two-step decode — the full envelope, discriminated by arm; pipe through `unwrap` for the
     * payload plus the matched schema `node`.
     *
     * @example Pair the schema with the typed payload — {@link getDecodedData} keeps the client's inference
     * ```ts
     * const decode = client.decodeInstruction(ix);
     * if (decode.kind === IdlStandard.Codama) {
     *     const { node } = unwrap(decode); // InstructionNode — render by schema
     *     const data = client.getDecodedData(decode); // payload typed from the IDL
     * }
     * ```
     */
    decodeInstruction: {
        (ix: Instruction): InstructionDecodeFor<T>;
        <R>(ix: Instruction, handlers: InstructionHandlers<T, R>): R;
    };
    /** Account counterpart of {@link decodeInstruction} — same arms, same `unwrap` pairing. */
    decodeAccount: {
        (data: ReadonlyUint8Array): AccountDecodeFor<T>;
        <R>(data: ReadonlyUint8Array, handlers: AccountHandlers<T, R>): R;
    };
    /**
     * {@link decodeAccount} + {@link getDecodedData} in one error-first step — same contract as
     * {@link decodeInstructionData}. `TData` defaults to the account payload inferred from the IDL's
     * type (pick one via `AccountsDataOf<typeof idl>['name']`, or bridge a renderers-js type with `AsDecoded<T>`).
     *
     * @example `expectedKind` asserts the arm — a decode landing elsewhere becomes the error, never the wrong-arm payload
     * ```ts
     * const [error, account] = client.decodeAccountData<{ authority: string }>(bytes, IdlStandard.Codama);
     * if (isIdlError(error, IDL_ERROR__DECODE_KIND_MISMATCH)) {
     *     error.context; // { expected: IdlStandard.Codama, received: 'anchor' } — an unknown-arm decode becomes the decode-failed error instead, never a mismatch
     * }
     * ```
     */
    decodeAccountData: <TData = AccountDataOf<T>>(
        data: ReadonlyUint8Array,
        expectedKind?: IdlStandard,
    ) => Result<TData>;
    /**
     * {@link decodeInstruction} + {@link getDecodedData} in one error-first step — the preferred
     * route when only the payload matters. `TData` defaults to the instruction-payload union
     * inferred from the IDL's type.
     *
     * @example Error-first — a miss or pipeline failure lands in the error slot; branch, never catch
     * ```ts
     * const [error, args] = client.decodeInstructionData<{ amount: bigint }>(ix);
     * if (!error) {
     *     args.amount; // typed inside the happy branch — no narrowing ceremony
     * }
     * ```
     */
    decodeInstructionData: <TData = InstructionDataOf<T>>(ix: Instruction, expectedKind?: IdlStandard) => Result<TData>;
    /** Decoded payload typed from the IDL; `undefined` only for the unknown arm — narrowing `decode.kind` first drops it. Anchor-arm payloads are consumer-declared — claim `TData` explicitly (the account/instruction overloads cannot tell those arms apart). */
    getDecodedData: {
        <TData = InstructionDataOf<T>>(decode: Extract<InstructionDecode, { kind: IdlStandard }>): TData;
        <TData = AccountDataOf<T>>(decode: Extract<AccountDecode, { kind: IdlStandard }>): TData;
        <TData = InstructionDataOf<T>>(decode: InstructionDecode): TData | undefined;
        <TData = AccountDataOf<T>>(decode: AccountDecode): TData | undefined;
    };
};

/**
 * Names-and-metadata client — no decode surface, no engine; throws on a lying type (use
 * {@link tryCreateIdlMetaClient} for untrusted input). Legacy (pre-0.30) input converts at
 * creation — the name table needs the converted root's derived discriminators.
 */
export function createIdlMetaClient(idl: AnchorV00Idl, options?: IdlMetaClientOptions): IdlMetaClient<CodamaIdl>;
export function createIdlMetaClient<T extends SupportedIdlInput>(
    idl: T,
    options?: IdlMetaClientOptions,
): IdlMetaClient<T>;
export function createIdlMetaClient<T extends SupportedIdlInput>(
    idl: AnchorV00Idl | T,
    options: IdlMetaClientOptions = {},
): IdlMetaClient<CodamaIdl> | IdlMetaClient<T> {
    if (isLegacyAnchorIdl(idl)) {
        const [error, root] = tryNormalizeLegacyIdl(idl, options.programAddress);
        if (error) throw error;
        return createIdlMetaClient(root);
    }
    if (!isSupportedIdl(idl)) throw unsupportedIdl();
    // eslint-disable-next-line typescript/consistent-type-assertions -- isLegacyAnchorIdl excluded the V00 member; TS cannot subtract it from the generic union
    return buildMetaClient(idl as T, idl);
}

/**
 * Client for a known-supported IDL; throws on a lying type (use {@link tryCreateIdlClient} for
 * untrusted input) and assumes the IDL is not mutated after construction. Legacy (pre-0.30) input
 * converts at creation — pass `options.programAddress` when the IDL declares no address.
 */
export function createIdlClient(idl: AnchorV00Idl, options?: IdlClientOptions): IdlClient<CodamaIdl>;
export function createIdlClient<T extends SupportedIdlInput>(idl: T, options?: IdlClientOptions): IdlClient<T>;
export function createIdlClient<T extends SupportedIdlInput>(
    idl: AnchorV00Idl | T,
    options: IdlClientOptions = {},
): IdlClient<CodamaIdl> | IdlClient<T> {
    if (isLegacyAnchorIdl(idl)) {
        const [error, root] = tryNormalizeLegacyIdl(idl, options.programAddress);
        if (error) throw error;
        return createIdlClient(root, options);
    }
    if (!isSupportedIdl(idl)) throw unsupportedIdl();
    // the guard's narrowing does not reach the nested function declarations — alias it once
    const supportedIdl: SupportedIdl = idl;

    // eslint-disable-next-line typescript/consistent-type-assertions -- isLegacyAnchorIdl excluded the V00 member; TS cannot subtract it from the generic union
    const metaClient = buildMetaClient(idl as T, supportedIdl);
    const { provider = codamaProvider(), ...fallbackOptions } = options;

    function decodeInstruction(ix: Instruction): InstructionDecodeFor<T>;
    function decodeInstruction<R>(ix: Instruction, handlers: InstructionHandlers<T, R>): R;
    function decodeInstruction<R>(ix: Instruction, handlers?: InstructionHandlers<T, R>) {
        const decode = provider.decodeInstruction(supportedIdl, ix, fallbackOptions);
        if (!handlers) return decode;
        return dispatch(decode, handlers);
    }

    function decodeAccount(data: ReadonlyUint8Array): AccountDecodeFor<T>;
    function decodeAccount<R>(data: ReadonlyUint8Array, handlers: AccountHandlers<T, R>): R;
    function decodeAccount<R>(data: ReadonlyUint8Array, handlers?: AccountHandlers<T, R>) {
        const decode = provider.decodeAccount(supportedIdl, data, fallbackOptions);
        if (!handlers) return decode;
        return dispatch(decode, handlers);
    }

    function decodeInstructionData<TData = InstructionDataOf<T>>(
        ix: Instruction,
        expectedKind?: IdlStandard,
    ): Result<TData> {
        let decode: InstructionDecodeFor<T>;
        try {
            decode = decodeInstruction(ix);
        } catch (cause) {
            // the two-step route fails loud on the wiring bug; the one-step route keeps every outcome a value
            if (isIdlError(cause, IDL_ERROR__IDL_ADDRESS_MISMATCH)) return err(cause);
            throw cause;
        }
        if (decode.kind === 'unknown') {
            // surface the pipeline's own failure rather than masking it; a plain miss gets a fresh error
            return err(
                decode.errors[0] ??
                    new IdlError(IDL_ERROR__INSTRUCTION_DECODE_FAILED, {
                        programAddress: ix.programAddress,
                        standard: getIdlStandard(supportedIdl),
                    }),
            );
        }
        if (expectedKind !== undefined && decode.kind !== expectedKind) {
            return err(
                new IdlError(IDL_ERROR__DECODE_KIND_MISMATCH, { expected: expectedKind, received: decode.kind }),
            );
        }
        return ok(getDecodedData<TData>(decode));
    }

    function decodeAccountData<TData = AccountDataOf<T>>(
        data: ReadonlyUint8Array,
        expectedKind?: IdlStandard,
    ): Result<TData> {
        const decode = decodeAccount(data);
        if (decode.kind === 'unknown') {
            return err(
                decode.errors[0] ??
                    new IdlError(IDL_ERROR__ACCOUNT_DECODE_FAILED, {
                        dataLength: data.length,
                        standard: getIdlStandard(supportedIdl),
                    }),
            );
        }
        if (expectedKind !== undefined && decode.kind !== expectedKind) {
            return err(
                new IdlError(IDL_ERROR__DECODE_KIND_MISMATCH, { expected: expectedKind, received: decode.kind }),
            );
        }
        return ok(getDecodedData<TData>(decode));
    }

    function getDecodedData<TData = InstructionDataOf<T>>(
        decode: Extract<InstructionDecode, { kind: IdlStandard }>,
    ): TData;
    function getDecodedData<TData = AccountDataOf<T>>(decode: Extract<AccountDecode, { kind: IdlStandard }>): TData;
    function getDecodedData<TData = InstructionDataOf<T>>(decode: InstructionDecode): TData | undefined;
    function getDecodedData<TData = AccountDataOf<T>>(decode: AccountDecode): TData | undefined;
    // eslint-disable-next-line unicorn/consistent-function-scoping -- the overload defaults capture the client's T type parameter (a type-level closure)
    function getDecodedData<TData>(decode: AccountDecode | InstructionDecode) {
        const data =
            decode.kind === IdlStandard.Codama
                ? decode.decoded.data
                : decode.kind === IdlStandard.Anchor
                  ? decode.decoded
                  : undefined;
        // eslint-disable-next-line typescript/consistent-type-assertions -- dynamically decoded payload; the IDL-derived (or caller-declared) shape is the contract
        return data as TData | undefined;
    }

    return {
        ...metaClient,
        decodeAccount,
        decodeAccountData,
        decodeInstruction,
        decodeInstructionData,
        getDecodedData,
    };
}

// Guard-passing input can still lie deeper than detection checks — a creation crash becomes the parse error.
function tryBuild<T>(build: () => T): Result<T, typeof IDL_ERROR__IDL_PARSE_FAILED> {
    try {
        return ok(build());
    } catch (cause) {
        return err(new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause, operation: 'idl client creation' }));
    }
}

/** Detect and wrap untrusted input — error-first result instead of a throw. */
export function tryCreateIdlClient(idl: unknown, options?: IdlClientOptions): Result<IdlClient, TryCreateIdlErrorCode> {
    if (isLegacyAnchorIdl(idl)) {
        const [error, root] = tryNormalizeLegacyIdl(idl, options?.programAddress);
        if (error) return err(error);
        return tryBuild(() => createIdlClient(root, options));
    }
    if (!isSupportedIdl(idl)) return err(unsupportedIdl());
    return tryBuild(() => createIdlClient(idl, options));
}

/** {@link createIdlMetaClient} over untrusted input — error-first result instead of a throw. */
export function tryCreateIdlMetaClient(
    idl: unknown,
    options?: IdlMetaClientOptions,
): Result<IdlMetaClient, TryCreateIdlErrorCode> {
    if (isLegacyAnchorIdl(idl)) {
        const [error, root] = tryNormalizeLegacyIdl(idl, options?.programAddress);
        if (error) return err(error);
        return tryBuild(() => createIdlMetaClient(root));
    }
    if (!isSupportedIdl(idl)) return err(unsupportedIdl());
    return tryBuild(() => createIdlMetaClient(idl));
}

export function isAnchorStandard(client: IdlClient): client is IdlClient<AnchorIdl>;
export function isAnchorStandard(client: IdlMetaClient): client is IdlMetaClient<AnchorIdl>;
export function isAnchorStandard(client: IdlMetaClient): boolean {
    return isAnchorIdl(client.idl);
}

export function isCodamaStandard(client: IdlClient): client is IdlClient<CodamaIdl>;
export function isCodamaStandard(client: IdlMetaClient): client is IdlMetaClient<CodamaIdl>;
export function isCodamaStandard(client: IdlMetaClient): boolean {
    return isCodamaIdl(client.idl);
}

function unsupportedIdl(): IdlError<typeof IDL_ERROR__UNSUPPORTED_IDL_FORMAT> {
    return new IdlError(IDL_ERROR__UNSUPPORTED_IDL_FORMAT);
}

// supportedIdl is the same value post-guard — a separate param because the narrowing does not travel with T
function buildMetaClient<T extends SupportedIdlInput>(idl: T, supportedIdl: SupportedIdl): IdlMetaClient<T> {
    const table = buildInstructionNameTable(supportedIdl);
    return {
        idl,
        formatVersion: () => getIdlVersion(supportedIdl),
        instructionName: data => matchInstructionName(table, data),
        programAddress: () => getIdlProgramAddress(supportedIdl),
        programName: () => buildProgramName(supportedIdl),
        programVersion: () => getIdlProgramVersion(supportedIdl),
    };
}

type AnyDecode = AccountDecode | InstructionDecode;

// Runtime-only widening — the public overloads enforce totality, so a miss here means the caller bypassed the types.
type AnyHandlers<R> = {
    anchor?: (decode: Extract<AnyDecode, { kind: IdlStandard.Anchor }>) => R;
    codama?: (decode: Extract<AnyDecode, { kind: IdlStandard.Codama }>) => R;
    unknown?: (decode: Extract<AnyDecode, { kind: 'unknown' }>) => R;
};

function dispatch<R>(decode: AnyDecode, handlers: object): R {
    // eslint-disable-next-line typescript/consistent-type-assertions -- an instruction dispatch only ever receives instruction handlers (and accounts likewise); TS cannot correlate the pairs across the widened union
    const map = handlers as AnyHandlers<R>;
    if (decode.kind === IdlStandard.Anchor && map.anchor) return map.anchor(decode);
    if (decode.kind === IdlStandard.Codama && map.codama) return map.codama(decode);
    if (decode.kind === 'unknown' && map.unknown) return map.unknown(decode);
    throw new IdlError(IDL_ERROR__MISSING_DECODE_HANDLER, { kind: decode.kind });
}
