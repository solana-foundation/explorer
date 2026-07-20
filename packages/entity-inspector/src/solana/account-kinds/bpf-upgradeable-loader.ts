import { BPF_UPGRADEABLE_LOADER_PROGRAM_ID } from '../constants.js';
import type { AccountPayloadContext } from '../types.js';
import { type AccountKindBuilder, unknownMarker } from './shared.js';

// Injected via context (app registry lands in Step 5) — the source hardcoded a two-entry label map here.
function resolveProgramAddressLabel(context: AccountPayloadContext): string | null {
    const address = context.account.address;
    if (!address) {
        return null;
    }
    return context.resolveProgramName?.(address) ?? null;
}

function buildUpgradeableLoaderOverviewFields(context: AccountPayloadContext): Record<string, unknown> {
    const account = context.account;
    const fields: Record<string, unknown> = {
        address: account.address ?? null,
        address_label: resolveProgramAddressLabel(context),
        balance_lamports: account.lamports ?? null,
        executable: account.executable ?? null,
        executable_data: account.programDataAddress ?? null,
    };

    if (account.programDataStatus === 'source_unavailable') {
        fields.upgradeable = unknownMarker('source_unavailable');
        fields.last_deployed_slot = unknownMarker('source_unavailable');
        fields.upgrade_authority = unknownMarker('source_unavailable');
        return fields;
    }

    const programData = account.programData;
    if (!programData) {
        fields.upgradeable = null;
        fields.last_deployed_slot = null;
        fields.upgrade_authority = null;
        return fields;
    }

    fields.upgradeable = programData.authority !== null;
    fields.last_deployed_slot = programData.slot;
    fields.upgrade_authority = programData.authority;
    return fields;
}

// Not routed yet — the router serves buildUnsupportedKindPayload for this kind until the idl-parser PR wires the enrichments.
export const buildBpfUpgradeableLoaderPayload: AccountKindBuilder = context => {
    const entity: Record<string, unknown> = {
        kind: context.kind,
        owner_program: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    };

    Object.assign(entity, buildUpgradeableLoaderOverviewFields(context));
    entity.verification = context.verificationResult ?? unknownMarker('source_unavailable');
    entity.security_metadata = context.securityMetadataResult ?? unknownMarker('source_unavailable');
    entity.idl = context.idlDiscoveryResult ?? unknownMarker('source_unavailable');
    entity.multisig = context.multisigReferenceResult ?? unknownMarker('source_unavailable');

    return { entity };
};
