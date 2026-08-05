import { type AccountKindBuilder, resolveProgramAddressLabel } from './shared.js';

// BPF enrichments (verification/security/idl/multisig) do not apply to native programs — deliberately absent.
export const buildNativeProgramPayload: AccountKindBuilder = context => ({
    entity: {
        address: context.account.address ?? null,
        address_label: resolveProgramAddressLabel(context),
        executable: context.account.executable ?? null,
        kind: context.kind,
    },
});
