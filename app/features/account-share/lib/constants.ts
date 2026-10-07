/** The wall-clock budget for all RPC + provenance work behind one account card. */
export const RPC_BUDGET_MS = 2_500;

/**
 * The activity-count cap for `getSignaturesForAddress`: one round trip, no paging, kept small so this
 * route stays light. The exact count tops out here and `100` prints as `100+`.
 */
export const SIGNATURE_LOOKUP_LIMIT = 100;

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
