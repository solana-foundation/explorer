import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ReadonlyUint8Array } from '@solana/kit';

import type { EnabledClusterNames, SupportedCluster } from '../../config.js';
import { consoleLogger, type InspectorLogger, ns } from '../../logger.js';
import { unknownMarker } from '../../accounts/account-kinds/shared.js';
import {
    ACCOUNT_IDENTIFIER_KIND,
    BPF_LOADER_2_KIND,
    BPF_LOADER_KIND,
    BPF_UPGRADEABLE_LOADER_KIND,
    LOADER_V4_KIND,
    UNKNOWN_KIND,
} from '../../accounts/kinds.js';
import { enrichUpgradeableProgramData, normalizeAccountProbe } from '../../accounts/account-normalizer.js';
import { decodeLoaderV4State, loaderV4ProgramBytes, loaderV4SigningAuthority } from '../../accounts/loader-v4-state.js';
import { buildAccountPayloadWithRouter } from '../../accounts/inspect-entity-account-router.js';
import {
    classifyAccountKindBase,
    decodeIdentifierKind,
    normalizeDasOutcome,
    promoteAccountKindWithDas,
} from '../../accounts/inspect-entity-classifier.js';
import type { ResolveMultisigReference } from '../../enrichments/multisig.js';
import type { ResolveSecurityMetadata } from '../../enrichments/security.js';
import type { ResolveProgramVerification } from '../../enrichments/verification.js';
import type { DiscoverProgramIdl, ResolveIdlClient } from '../../enrichments/idl-clients.js';
import { asRecord, asString } from '../../shared/parse-helpers.js';
import { base64Decoder } from '../../rpc/codecs.js';
import { isSourceUnavailableError, type RpcClient } from '../../rpc/rpc.js';
import { buildTransactionPayload } from '../../transactions/build-payload.js';
import { decodeTransactionInstructions } from '../../transactions/decode-instructions.js';
import { normalizeTransactionProbe } from '../../transactions/normalizer.js';
import type {
    AccountEntityKind,
    AccountPayloadContext,
    DasClassificationOutcome,
    NormalizedAccountInfo,
} from '../../accounts/types.js';
import type { DecodeInstructionFallback } from '../../transactions/types.js';
import type { McpAnalyticsEvent } from '../../types.js';
import {
    currentlyUnsupported,
    internalError,
    invalidArgument,
    type McpToolError,
    notFound,
    sanitizeToolError,
    toToolResult,
} from '../errors.js';
import { inspectEntityInputSchema } from '../schemas.js';

export type InspectEntityDependencies = {
    decodeInstructionFallback?: DecodeInstructionFallback;
    discoverProgramIdl?: DiscoverProgramIdl;
    // Carried here so this handler's parse applies the same enum the tool advertised, however it is called.
    enabledClusterNames?: EnabledClusterNames;
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    fetchAsset: RpcClient['fetchAsset'];
    fetchSignatureStatus: RpcClient['fetchSignatureStatus'];
    fetchTransaction: RpcClient['fetchTransaction'];
    logger?: InspectorLogger;
    resolveIdlClient?: ResolveIdlClient;
    resolveMultisigReference?: ResolveMultisigReference;
    resolveProgramName?: (address: string) => string | undefined;
    resolveProgramVerification?: ResolveProgramVerification;
    resolveSecurityMetadata?: ResolveSecurityMetadata;
    track?: (event: McpAnalyticsEvent) => void;
};

function toSourceUnavailablePayload(kind: 'account' | 'transaction'): Record<string, unknown> {
    return {
        entity: {
            kind,
            source: unknownMarker('source_unavailable'),
        },
    };
}

function toNotFoundPayload(kind: 'account' | 'transaction'): Record<string, unknown> {
    return {
        entity: {
            kind,
        },
    };
}

// Lifts builder-level `errors` (strings, e.g. the unsupported-kind payload) into the tool's typed error array.
export function splitBuilderErrors(routedPayload: Record<string, unknown>): {
    payload: Record<string, unknown>;
    errors: McpToolError[];
} {
    const { errors: rawErrors, ...payload } = routedPayload;
    if (!Array.isArray(rawErrors)) {
        return { errors: [], payload };
    }
    const errors = rawErrors.flatMap(entry => {
        const message = asString(entry);
        return message ? [currentlyUnsupported(message)] : [];
    });
    return { errors, payload };
}

// The kinds whose accounts are programs — the only kinds the program enrichments apply to.
const PROGRAM_LOADER_KINDS: ReadonlySet<AccountEntityKind> = new Set([
    BPF_LOADER_2_KIND,
    BPF_LOADER_KIND,
    BPF_UPGRADEABLE_LOADER_KIND,
    LOADER_V4_KIND,
]);

async function resolveAccount(
    identifier: string,
    cluster: SupportedCluster,
    dependencies: InspectEntityDependencies,
): Promise<CallToolResult> {
    const logger = dependencies.logger ?? consoleLogger;
    try {
        const accountProbe = await dependencies.fetchAccountInfo(identifier, cluster);
        const normalizedAccount = normalizeAccountProbe(identifier, accountProbe);

        if (normalizedAccount === null) {
            return toToolResult({
                errors: [notFound()],
                payload: toNotFoundPayload('account'),
            });
        }

        const enrichedAccount = await enrichUpgradeableProgramData(
            normalizedAccount,
            cluster,
            dependencies.fetchAccountInfo,
            logger,
        );

        const baseKind = classifyAccountKindBase(enrichedAccount);

        let dasOutcome: DasClassificationOutcome | null = null;
        if (baseKind === UNKNOWN_KIND) {
            try {
                dasOutcome = normalizeDasOutcome(await dependencies.fetchAsset(identifier, cluster));
            } catch (error) {
                logger.warn(ns('inspect_entity DAS lookup failed'), { error, identifier });
                dasOutcome = null;
            }
        }

        const finalKind = promoteAccountKindWithDas(baseKind, dasOutcome);

        // Program enrichments only apply to loader-owned program accounts — resolve them just there.
        const enrichments = PROGRAM_LOADER_KINDS.has(finalKind)
            ? await resolveProgramEnrichments(identifier, finalKind, enrichedAccount, cluster, dependencies, logger)
            : null;

        const routedPayload = buildAccountPayloadWithRouter({
            account: enrichedAccount,
            kind: finalKind,
            ...(dasOutcome ? { dasOutcome } : {}),
            ...enrichments,
            ...(dependencies.resolveProgramName ? { resolveProgramName: dependencies.resolveProgramName } : {}),
        });

        if (finalKind === UNKNOWN_KIND) {
            const decoded = await resolveIdlDecodedData(enrichedAccount, cluster, dependencies);
            if (decoded) {
                routedPayload.entity = { ...asRecord(routedPayload.entity), decoded };
            }
        }

        const { errors, payload } = splitBuilderErrors(routedPayload);
        return toToolResult({ errors, payload });
    } catch (error) {
        logger.error(ns('inspect_entity account resolution failed'), { error, identifier });

        if (isSourceUnavailableError(error)) {
            return toToolResult({
                errors: [internalError()],
                payload: toSourceUnavailablePayload('account'),
            });
        }

        return toToolResult({
            errors: [internalError()],
            payload: {},
        });
    }
}

type ProgramEnrichments = Pick<
    AccountPayloadContext,
    'idlDiscoveryResult' | 'multisigReferenceResult' | 'securityMetadataResult' | 'verificationResult'
>;

// A resolver outage degrades its own field to unknown/source_unavailable — never the whole payload.
function catchEnrichment<T>(
    promise: Promise<T>,
    label: string,
    identifier: string,
    logger: InspectorLogger,
): Promise<T | { status: 'unknown'; reason: 'source_unavailable' }> {
    return promise.catch(error => {
        logger.warn(ns(`${label} enrichment failed`), { error, identifier });
        return { reason: 'source_unavailable', status: 'unknown' } as const;
    });
}

type ProgramAuthorityContext = {
    authority: string | null;
    // What the verification hash runs over: the verbatim RPC base64 where one exists, or the raw
    // bytes past loader-v4's state header (encoded lazily so a codec throw degrades only that field).
    verificationData: string | ReadonlyUint8Array | null;
    stateError?: Error;
};

// v1/v2 programs have no authority; upgradeable ones carry it in programdata; loader-v4 decodes it from its own state header.
function resolveProgramAuthorityContext(
    kind: AccountEntityKind,
    account: NormalizedAccountInfo,
): ProgramAuthorityContext {
    if (kind !== LOADER_V4_KIND) {
        return {
            authority: account.programData?.authority ?? null,
            // Legacy loaders keep the ELF in the program account itself; upgradeable probes are jsonParsed and carry none.
            verificationData: account.programDataRawBase64 ?? account.rawDataBase64 ?? null,
        };
    }

    const bytes = account.rawDataBytes;
    const [stateError, state] = decodeLoaderV4State(bytes);
    if (!bytes || !state) {
        return { authority: null, stateError, verificationData: null };
    }
    // A null authority (finalized) routes verification down the frozen registry path, which never reads bytes.
    const authority = loaderV4SigningAuthority(state);
    return {
        authority,
        verificationData: authority === null ? null : loaderV4ProgramBytes(bytes),
    };
}

// All four program enrichments resolve in parallel; a missing dep leaves its field absent so the
// builder falls back to its own unknown marker.
async function resolveProgramEnrichments(
    identifier: string,
    kind: AccountEntityKind,
    account: NormalizedAccountInfo,
    cluster: SupportedCluster,
    dependencies: InspectEntityDependencies,
    logger: InspectorLogger,
): Promise<ProgramEnrichments> {
    const { authority, stateError, verificationData } = resolveProgramAuthorityContext(kind, account);
    if (stateError) {
        logger.warn(ns('loader-v4 state undecoded'), { error: stateError, identifier });
    }
    const stateUndecoded = Boolean(stateError);
    const securityDataBase64 = account.programDataRawBase64 ?? account.rawDataBase64 ?? null;
    // An undecodable loader-v4 state must not masquerade as a frozen program — degrade both authority-driven fields.
    const loaderStateUnknown = { reason: 'loader_state_undecoded', status: 'unknown' } as const;
    const resolveVerification = dependencies.resolveProgramVerification;
    // Encoded inside the guarded promise: kit's browser base64 codec throws on ELF-sized arrays, and a throw here must cost one field, not the payload.
    const verificationBase64 = async (): Promise<string | null> =>
        typeof verificationData === 'string' || verificationData === null
            ? verificationData
            : base64Decoder().decode(verificationData);

    const [idlDiscovery, verification, security, multisig] = await Promise.all([
        dependencies.discoverProgramIdl
            ? catchEnrichment(
                  dependencies.discoverProgramIdl(identifier, cluster).then(({ discovery }) => discovery),
                  'program idl',
                  identifier,
                  logger,
              )
            : null,
        stateUndecoded
            ? loaderStateUnknown
            : resolveVerification
              ? catchEnrichment(
                    verificationBase64().then(data => resolveVerification(identifier, authority, data, cluster)),
                    'verification',
                    identifier,
                    logger,
                )
              : null,
        dependencies.resolveSecurityMetadata
            ? catchEnrichment(
                  dependencies.resolveSecurityMetadata(identifier, securityDataBase64, cluster),
                  'security metadata',
                  identifier,
                  logger,
              )
            : null,
        stateUndecoded
            ? loaderStateUnknown
            : dependencies.resolveMultisigReference
              ? catchEnrichment(
                    dependencies.resolveMultisigReference(authority, cluster),
                    'multisig reference',
                    identifier,
                    logger,
                )
              : null,
    ]);

    return {
        ...(idlDiscovery ? { idlDiscoveryResult: idlDiscovery } : {}),
        ...(verification ? { verificationResult: verification } : {}),
        ...(security ? { securityMetadataResult: security } : {}),
        ...(multisig ? { multisigReferenceResult: multisig } : {}),
    };
}

// Unknown-kind accounts get one shot at an IDL decode: resolve the owner program's IDL and decode
// the raw bytes; every failure resolves null and leaves the kind-only payload as is.
async function resolveIdlDecodedData(
    account: NormalizedAccountInfo,
    cluster: SupportedCluster,
    dependencies: InspectEntityDependencies,
): Promise<Record<string, unknown> | null> {
    // asString guards the raw RPC passthrough — a malformed probe must not reach the resolver.
    const owner = asString(account.owner);
    if (!dependencies.resolveIdlClient || !owner || !account.rawDataBytes) {
        return null;
    }

    const client = await dependencies.resolveIdlClient(owner, cluster);
    if (!client) {
        return null;
    }

    const [error, info] = client.decodeAccountData(account.rawDataBytes);
    if (error) {
        return null;
    }

    const program = client.programName();
    return { info, source: 'idl', ...(program !== undefined ? { program } : {}) };
}

async function resolveTransaction(
    identifier: string,
    cluster: SupportedCluster,
    dependencies: InspectEntityDependencies,
): Promise<CallToolResult> {
    const logger = dependencies.logger ?? consoleLogger;
    try {
        const [transactionProbe, signatureStatus] = await Promise.all([
            dependencies.fetchTransaction(identifier, cluster),
            // Confirmation detail is best-effort — its outage must not take down the whole lookup.
            dependencies.fetchSignatureStatus(identifier, cluster).catch(error => {
                logger.warn(ns('inspect_entity signature status fetch failed'), {
                    error,
                    identifier,
                });
                return null;
            }),
        ]);

        const transactionContext = normalizeTransactionProbe(identifier, transactionProbe, signatureStatus, logger);
        if (transactionContext === null) {
            return toToolResult({
                errors: [notFound()],
                payload: toNotFoundPayload('transaction'),
            });
        }

        const { resolveIdlClient } = dependencies;
        const instructions = await decodeTransactionInstructions(transactionContext, {
            logger,
            ...(dependencies.decodeInstructionFallback
                ? { decodeInstructionFallback: dependencies.decodeInstructionFallback }
                : {}),
            ...(resolveIdlClient
                ? { resolveIdlClient: (programAddress: string) => resolveIdlClient(programAddress, cluster) }
                : {}),
        });

        // A null status only means the status fetch failed (the RPC never legitimately resolves null) —
        // surface it as a non-fatal error so callers can tell "outage" from "not yet confirmed".
        const errors: McpToolError[] = [];
        if (signatureStatus === null) {
            errors.push(internalError('Confirmation status temporarily unavailable.'));
        }

        return toToolResult({
            errors,
            isError: false,
            payload: buildTransactionPayload(transactionContext, instructions),
        });
    } catch (error) {
        logger.error(ns('inspect_entity transaction resolution failed'), { error, identifier });

        if (isSourceUnavailableError(error)) {
            return toToolResult({
                errors: [internalError()],
                payload: toSourceUnavailablePayload('transaction'),
            });
        }

        return toToolResult({
            errors: [internalError()],
            payload: {},
        });
    }
}

export async function handleInspectEntity(
    rawInput: unknown,
    dependencies: InspectEntityDependencies,
): Promise<CallToolResult> {
    const parseResult = inspectEntityInputSchema(dependencies.enabledClusterNames).safeParse(rawInput);
    if (!parseResult.success) {
        return toToolResult({
            errors: [sanitizeToolError(parseResult.error)],
            payload: {},
        });
    }

    const input = parseResult.data;
    const [identifierError, identifierKind] = decodeIdentifierKind(input.identifier);

    if (identifierError) {
        return toToolResult({
            errors: [invalidArgument(identifierError.message)],
            payload: {},
        });
    }

    if (identifierKind === ACCOUNT_IDENTIFIER_KIND) {
        return resolveAccount(input.identifier, input.cluster, dependencies);
    }

    return resolveTransaction(input.identifier, input.cluster, dependencies);
}
