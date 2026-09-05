import { LOADER_V4_PROGRAM_ID } from '../../shared/constants.js';
import { asSafeNumeric } from '../../shared/parse-helpers.js';
import { decodeLoaderV4State, loaderV4SigningAuthority } from '../loader-v4-state.js';
import { type AccountKindBuilder, resolveProgramAddressLabel, unknownMarker } from './shared.js';

export const buildLoaderV4Payload: AccountKindBuilder = context => {
    const entity: Record<string, unknown> = {
        address: context.account.address ?? null,
        address_label: resolveProgramAddressLabel(context),
        balance_lamports: context.account.lamports ?? null,
        executable: context.account.executable ?? null,
        kind: context.kind,
        owner_program: LOADER_V4_PROGRAM_ID,
    };

    const [, state] = decodeLoaderV4State(context.account.rawDataBytes);
    if (state) {
        entity.status = state.status;
        entity.upgradeable = state.status !== 'finalized';
        // Not last_deployed_slot: the header slot also records retracts and initializes.
        entity.last_state_change_slot = asSafeNumeric(state.slot);
        entity.upgrade_authority = loaderV4SigningAuthority(state);
    } else {
        entity.status = unknownMarker('loader_state_undecoded');
        entity.upgradeable = unknownMarker('loader_state_undecoded');
        entity.last_state_change_slot = unknownMarker('loader_state_undecoded');
        entity.upgrade_authority = unknownMarker('loader_state_undecoded');
    }

    entity.verification = context.verificationResult ?? unknownMarker('source_unavailable');
    entity.security_metadata = context.securityMetadataResult ?? unknownMarker('source_unavailable');
    entity.idl = context.idlDiscoveryResult ?? unknownMarker('source_unavailable');
    entity.multisig = context.multisigReferenceResult ?? unknownMarker('source_unavailable');

    return { entity };
};
