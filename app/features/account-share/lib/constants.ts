/** The wall-clock budget for all RPC + provenance work behind one account card. */
export const RPC_BUDGET_MS = 2_500;

/**
 * The activity-count cap, and the RPC's own per-call ceiling for `getSignaturesForAddress`: one round trip,
 * no paging, so the exact count tops out here and `1,000` prints as `1,000+`.
 */
export const SIGNATURE_LOOKUP_LIMIT = 1_000;

// Program loader account owners, reused from the shared entity-inspector constants so this route and the
// program page classify loaders from one source. (`SYSTEM_PROGRAM_ADDRESS` comes from its own client.)
export {
    BPF_LOADER_2_PROGRAM_ID as BPF_LOADER_2_ADDRESS,
    BPF_LOADER_PROGRAM_ID as BPF_LOADER_ADDRESS,
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID as BPF_UPGRADEABLE_LOADER_ADDRESS,
    LOADER_V4_PROGRAM_ID as LOADER_V4_ADDRESS,
    NATIVE_LOADER_PROGRAM_ID as NATIVE_LOADER_ADDRESS,
} from '@explorer/entity-inspector/constants';

/** The upgradeable program-data account prefixes its bytes with this many, so the program size subtracts it. */
export const PROGRAM_DATA_HEADER_SIZE = 45;

/** LoaderV4 accounts prefix their ELF with a slot (u64), authority (32), and status (u8) header. */
export const LOADER_V4_HEADER_SIZE = 48;
