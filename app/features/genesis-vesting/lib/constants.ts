export { GENESIS_PROGRAM_ADDRESS } from '@entities/genesis';

/** First byte of a `ClaimScheduleBucketV2` account (the Genesis `Key` enum). */
export const CLAIM_SCHEDULE_BUCKET_V2_KEY = 29;

/** Fixed part of a `ClaimScheduleBucketV2`; trailing 40-byte end behaviors make accounts longer. */
export const CLAIM_SCHEDULE_BUCKET_V2_SIZE = 944;

/** Byte offset of `bucket.base_mint`, the filter for finding every lock of a mint. */
export const LOCK_MINT_OFFSET = 80;
