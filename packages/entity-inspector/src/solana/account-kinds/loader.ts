import { LOADER_V4_PROGRAM_ID } from '../constants.js';
import { type AccountKindBuilder, resolveProgramAddressLabel, unknownMarker } from './shared.js';

// Not routed yet — the router serves buildUnsupportedKindPayload for this kind until the @explorer/idl-decode PR wires the enrichments.
export const buildLoaderV4Payload: AccountKindBuilder = context => {
    const entity: Record<string, unknown> = {
        address: context.account.address ?? null,
        address_label: resolveProgramAddressLabel(context),
        balance_lamports: context.account.lamports ?? null,
        executable: context.account.executable ?? null,
        kind: context.kind,
        owner_program: LOADER_V4_PROGRAM_ID,
    };

    entity.verification = context.verificationResult ?? unknownMarker('source_unavailable');
    entity.security_metadata = context.securityMetadataResult ?? unknownMarker('source_unavailable');
    entity.idl = context.idlDiscoveryResult ?? unknownMarker('source_unavailable');
    entity.multisig = context.multisigReferenceResult ?? unknownMarker('source_unavailable');

    return { entity };
};
