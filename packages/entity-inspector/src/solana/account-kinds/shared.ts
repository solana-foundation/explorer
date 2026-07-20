import { asBoolean, asRecord, asSafeNumeric, asString } from '../parse-helpers.js';
import type { AccountEntityKind, AccountPayloadContext, NormalizedAccountInfo, UnknownMarker } from '../types.js';

export type AccountKindBuilder = (context: AccountPayloadContext) => Record<string, unknown>;

export function assertUnreachable(kind: never): never {
    throw new Error(`Unhandled account entity kind: ${String(kind)}`);
}

// Injected via context (app registry lands in Step 5) — the source hardcoded a label map instead.
export function resolveProgramAddressLabel(context: AccountPayloadContext): string | null {
    const address = context.account.address;
    if (!address) {
        return null;
    }
    return context.resolveProgramName?.(address) ?? null;
}

export function unknownMarker(reason: string): UnknownMarker {
    return {
        reason,
        status: 'unknown',
        value: null,
    };
}

export function buildTokenEntityFields(
    kind: AccountEntityKind,
    account: NormalizedAccountInfo,
): Record<string, string> {
    const entityFields: Record<string, string> = {};
    const parsedInfo = asRecord(asRecord(account.parsedData)?.info);
    const mint = asString(parsedInfo?.mint);
    const owner = asString(parsedInfo?.owner);

    if (mint) {
        entityFields.mint = mint;
    }
    if (owner) {
        entityFields.owner = owner;
    }
    if (kind.startsWith('spl-token')) {
        entityFields.token_program = account.owner ?? '';
    }
    if (!entityFields.token_program) {
        delete entityFields.token_program;
    }

    return entityFields;
}

export function buildKindOnlyPayload(context: AccountPayloadContext): Record<string, unknown> {
    return {
        entity: {
            kind: context.kind,
        },
    };
}

// Follows the tool's { entity, errors } payload contract; used while a kind's real builder awaits missing infrastructure.
export const buildUnsupportedKindPayload: AccountKindBuilder = context => ({
    entity: {
        kind: context.kind,
    },
    errors: [`${context.kind} accounts are not supported yet`],
});

export function buildMintOverviewFields(account: NormalizedAccountInfo): Record<string, unknown> {
    const parsedInfo = asRecord(asRecord(account.parsedData)?.info);

    const supply = asString(parsedInfo?.supply);
    const decimals = asSafeNumeric(parsedInfo?.decimals);
    const isInitialized = asBoolean(parsedInfo?.isInitialized);
    const mintAuthority = asString(parsedInfo?.mintAuthority);
    const freezeAuthority = asString(parsedInfo?.freezeAuthority);

    // RPC includes mintAuthority for initialized mints (null = revoked/fixed supply) — only derive supplyType when the key is explicitly present.
    let supplyType: string | null = null;
    if (isInitialized === true && parsedInfo !== null && 'mintAuthority' in parsedInfo) {
        supplyType = mintAuthority === null ? 'fixed' : 'variable';
    }

    const fields: Record<string, unknown> = {
        address: account.address ?? null,
        decimals,
        freeze_authority: freezeAuthority,
        is_initialized: isInitialized,
        mint_authority: mintAuthority,
        supply,
        supply_type: supplyType,
        token_program: account.owner ?? null,
    };

    if (!fields.token_program) {
        delete fields.token_program;
    }

    return fields;
}

export function buildSplMultisigFields(account: NormalizedAccountInfo): Record<string, unknown> {
    const parsedInfo = asRecord(asRecord(account.parsedData)?.info);
    const rawSigners = parsedInfo?.signers;
    const signers = Array.isArray(rawSigners)
        ? rawSigners.flatMap((s: unknown) => {
              const v = asString(s);
              return v ? [v] : [];
          })
        : null;
    return {
        is_initialized: asBoolean(parsedInfo?.isInitialized),
        num_required_signers: asSafeNumeric(parsedInfo?.numRequiredSigners),
        num_valid_signers: asSafeNumeric(parsedInfo?.numValidSigners),
        signers,
    };
}
