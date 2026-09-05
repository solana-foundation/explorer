import { isEnvEnabled } from '@utils/env';

/**
 * Whether the transaction page projects what a transaction would pay under SIMD-0553.
 *
 * The projection models a draft proposal: the staged rates, the inclusion fee, and whether any of
 * it activates are all still open. The flag lets a deployment carry the row without committing to
 * it — and pull it back if the numbers move — without reverting the entity.
 *
 * Read at the call site rather than at module scope, so `vi.stubEnv` can flip it in tests.
 * `NEXT_PUBLIC_*` is inlined by Next at build time whether read here or at module scope, so the
 * call-site read costs the client nothing.
 */
export const isSimd0553FeeEnabled = () => isEnvEnabled(process.env.NEXT_PUBLIC_SIMD_0553_FEE_ENABLED);
