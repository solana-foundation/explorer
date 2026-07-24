import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { SupportedCluster } from '../../config.js';
import { consoleLogger, type InspectorLogger, ns } from '../../logger.js';
import { unknownMarker } from '../../solana/account-kinds/shared.js';
import { enrichUpgradeableProgramData, normalizeAccountProbe } from '../../solana/account-normalizer.js';
import { buildAccountPayloadWithRouter } from '../../solana/inspect-entity-account-router.js';
import {
    classifyAccountKindBase,
    decodeIdentifierKind,
    normalizeDasOutcome,
    promoteAccountKindWithDas,
} from '../../solana/inspect-entity-classifier.js';
import type { DiscoverProgramIdl, ResolveIdlClient } from '../../solana/idl-clients.js';
import { asRecord, asString } from '../../solana/parse-helpers.js';
import { isSourceUnavailableError, type RpcClient } from '../../solana/rpc.js';
import { buildTransactionPayload } from '../../solana/transaction/build-payload.js';
import { decodeTransactionInstructions } from '../../solana/transaction/decode-instructions.js';
import { normalizeTransactionProbe } from '../../solana/transaction/normalizer.js';
import type { DasClassificationOutcome, DecodeInstructionFallback, NormalizedAccountInfo } from '../../solana/types.js';
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

// The remaining resolver deps (verification/security/multisig) return with plan Step 7.
export type InspectEntityDependencies = {
    decodeInstructionFallback?: DecodeInstructionFallback;
    discoverProgramIdl?: DiscoverProgramIdl;
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    fetchAsset: RpcClient['fetchAsset'];
    fetchSignatureStatus: RpcClient['fetchSignatureStatus'];
    fetchTransaction: RpcClient['fetchTransaction'];
    logger?: InspectorLogger;
    resolveIdlClient?: ResolveIdlClient;
    resolveProgramName?: (address: string) => string | undefined;
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
        if (baseKind === 'unknown') {
            try {
                dasOutcome = normalizeDasOutcome(await dependencies.fetchAsset(identifier, cluster));
            } catch (error) {
                logger.warn(ns('inspect_entity DAS lookup failed'), { error, identifier });
                dasOutcome = null;
            }
        }

        const finalKind = promoteAccountKindWithDas(baseKind, dasOutcome);

        // The program-IDL enrichment is only consumed by the upgradeable-loader builder — resolve it just there.
        const idlDiscovery =
            finalKind === 'bpf-upgradeable-loader' && dependencies.discoverProgramIdl
                ? await dependencies.discoverProgramIdl(identifier, cluster)
                : null;

        const routedPayload = buildAccountPayloadWithRouter({
            account: enrichedAccount,
            kind: finalKind,
            ...(dasOutcome ? { dasOutcome } : {}),
            ...(idlDiscovery ? { idlDiscoveryResult: idlDiscovery.discovery } : {}),
            ...(dependencies.resolveProgramName ? { resolveProgramName: dependencies.resolveProgramName } : {}),
        });

        if (finalKind === 'unknown') {
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

        return toToolResult({
            errors: [],
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

    if (identifierKind === 'invalid') {
        return toToolResult({
            errors: [invalidArgument('identifier must decode from base58 to 32 or 64 bytes')],
            payload: {},
        });
    }

    if (identifierKind === 'account') {
        return resolveAccount(input.identifier, input.cluster, dependencies);
    }

    return resolveTransaction(input.identifier, input.cluster, dependencies);
}
