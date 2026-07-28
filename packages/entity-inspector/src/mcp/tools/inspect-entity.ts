import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { SupportedCluster } from '../../config.js';
import { consoleLogger, type InspectorLogger, ns } from '../../logger.js';
import { unknownMarker } from '../../accounts/account-kinds/shared.js';
import { ACCOUNT_IDENTIFIER_KIND, INVALID_IDENTIFIER_KIND, UNKNOWN_KIND } from '../../accounts/kinds.js';
import { enrichUpgradeableProgramData, normalizeAccountProbe } from '../../accounts/account-normalizer.js';
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
import { isSourceUnavailableError, type RpcClient } from '../../rpc/rpc.js';
import { buildTransactionPayload } from '../../transactions/build-payload.js';
import { decodeTransactionInstructions } from '../../transactions/decode-instructions.js';
import { normalizeTransactionProbe } from '../../transactions/normalizer.js';
import type { AccountPayloadContext, DasClassificationOutcome, NormalizedAccountInfo } from '../../accounts/types.js';
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

        // Program enrichments are only consumed by the upgradeable-loader builder — resolve them just there.
        const enrichments =
            finalKind === 'bpf-upgradeable-loader'
                ? await resolveProgramEnrichments(identifier, enrichedAccount, cluster, dependencies, logger)
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

// All four program enrichments resolve in parallel; a missing dep leaves its field absent so the
// builder falls back to its own unknown marker.
async function resolveProgramEnrichments(
    identifier: string,
    account: NormalizedAccountInfo,
    cluster: SupportedCluster,
    dependencies: InspectEntityDependencies,
    logger: InspectorLogger,
): Promise<ProgramEnrichments> {
    const authority = account.programData?.authority ?? null;
    const programDataBase64 = account.programDataRawBase64 ?? null;

    const [idlDiscovery, verification, security, multisig] = await Promise.all([
        dependencies.discoverProgramIdl
            ? catchEnrichment(
                  dependencies.discoverProgramIdl(identifier, cluster).then(({ discovery }) => discovery),
                  'program idl',
                  identifier,
                  logger,
              )
            : null,
        dependencies.resolveProgramVerification
            ? catchEnrichment(
                  dependencies.resolveProgramVerification(identifier, authority, programDataBase64, cluster),
                  'verification',
                  identifier,
                  logger,
              )
            : null,
        dependencies.resolveSecurityMetadata
            ? catchEnrichment(
                  dependencies.resolveSecurityMetadata(identifier, programDataBase64, cluster),
                  'security metadata',
                  identifier,
                  logger,
              )
            : null,
        dependencies.resolveMultisigReference
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
    const parseResult = inspectEntityInputSchema().safeParse(rawInput);
    if (!parseResult.success) {
        return toToolResult({
            errors: [sanitizeToolError(parseResult.error)],
            payload: {},
        });
    }

    const input = parseResult.data;
    const identifierKind = decodeIdentifierKind(input.identifier, dependencies.logger);

    if (identifierKind === INVALID_IDENTIFIER_KIND) {
        return toToolResult({
            errors: [invalidArgument('identifier must decode from base58 to 32 or 64 bytes')],
            payload: {},
        });
    }

    if (identifierKind === ACCOUNT_IDENTIFIER_KIND) {
        return resolveAccount(input.identifier, input.cluster, dependencies);
    }

    return resolveTransaction(input.identifier, input.cluster, dependencies);
}
