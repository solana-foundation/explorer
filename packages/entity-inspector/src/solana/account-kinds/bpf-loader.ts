import { BPF_LOADER_2_PROGRAM_ID, BPF_LOADER_PROGRAM_ID } from '../constants.js';
import { type AccountKindBuilder, resolveProgramAddressLabel, unknownMarker } from './shared.js';

// Not routed yet — the router serves buildUnsupportedKindPayload for these kinds until the @explorer/idl-decode PR wires the enrichments.
function buildPayload(ownerProgram: string): AccountKindBuilder {
    return context => {
        const entity: Record<string, unknown> = {
            address: context.account.address ?? null,
            address_label: resolveProgramAddressLabel(context),
            balance_lamports: context.account.lamports ?? null,
            executable: context.account.executable ?? null,
            kind: context.kind,
            owner_program: ownerProgram,
        };

        entity.verification = context.verificationResult ?? unknownMarker('source_unavailable');
        entity.security_metadata = context.securityMetadataResult ?? unknownMarker('source_unavailable');
        entity.idl = context.idlDiscoveryResult ?? unknownMarker('source_unavailable');
        entity.multisig = context.multisigReferenceResult ?? unknownMarker('source_unavailable');

        return { entity };
    };
}

export const buildBpfLoaderPayload: AccountKindBuilder = buildPayload(BPF_LOADER_PROGRAM_ID);
export const buildBpfLoader2Payload: AccountKindBuilder = buildPayload(BPF_LOADER_2_PROGRAM_ID);
