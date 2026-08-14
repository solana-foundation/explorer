// Cross-entity public API (FSD `@x`) that lets the `pmp-instruction` entity reach the three decode-hint shapes the
// `pmp-account` entity owns.
//
// Unlike the sibling `@x/decode-instruction-pmp` door, this one is NOT weight-sensitive: the instruction decoders
// behind it already pull the generated client, so re-exporting the validator costs nothing extra here.
export { PMP_ADDRESS } from '../../lib/program-address';
export type { PmpDecodeConfig } from '../../lib/types';
export { PmpDecodeConfigStruct } from '../../lib/validators';
