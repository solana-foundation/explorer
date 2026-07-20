import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { SupportedCluster } from '../../config.js';
import { consoleLogger, type InspectorLogger } from '../../logger.js';
import { unknownMarker } from '../../solana/account-kinds/shared.js';
import { enrichUpgradeableProgramData, normalizeAccountProbe } from '../../solana/account-normalizer.js';
import { buildAccountPayloadWithRouter } from '../../solana/inspect-entity-account-router.js';
import {
    classifyAccountKindBase,
    decodeIdentifierKind,
    normalizeDasOutcome,
    promoteAccountKindWithDas,
} from '../../solana/inspect-entity-classifier.js';
import { asString } from '../../solana/parse-helpers.js';
import { isSourceUnavailableError, type RpcClient } from '../../solana/rpc.js';
import type { DasClassificationOutcome } from '../../solana/types.js';
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

// The source's resolver deps (verification/security/multisig/idl) return with the @explorer/idl-decode PR.
export type InspectEntityDependencies = {
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    fetchAsset: RpcClient['fetchAsset'];
    logger?: InspectorLogger;
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
        return { errors: [], payload: routedPayload };
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
                logger.warn('[entity-inspector] inspect_entity DAS lookup failed', { error, identifier });
                dasOutcome = null;
            }
        }

        const finalKind = promoteAccountKindWithDas(baseKind, dasOutcome);
        const routedPayload = buildAccountPayloadWithRouter({
            account: enrichedAccount,
            kind: finalKind,
            ...(dasOutcome ? { dasOutcome } : {}),
            ...(dependencies.resolveProgramName ? { resolveProgramName: dependencies.resolveProgramName } : {}),
        });

        const { errors, payload } = splitBuilderErrors(routedPayload);
        return toToolResult({ errors, payload });
    } catch (error) {
        logger.error('[entity-inspector] inspect_entity account resolution failed', { error, identifier });

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

    // Transaction path lands with plan Step 6 (normalizer + ALT + decode cascade).
    return toToolResult({
        errors: [currentlyUnsupported('transaction inspection is not supported yet')],
        payload: { entity: { kind: 'transaction' } },
    });
}
