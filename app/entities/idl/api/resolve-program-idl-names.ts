import { createAbortableRpc } from '@entities/cluster/@x/idl';
import { isRetryableError } from '@shared/lib/errors';
import { address, createSolanaRpc } from '@solana/kit';
import { type BackoffOptions, withBackoff } from '@utils/with-backoff';

import { buildProgramIdlNames, type ProgramIdlNames } from '../model/instruction-name-table';
import { NON_ANCHOR_PROGRAMS } from './config';
import { resolveProgramIdls } from './resolve-program-idls';
import { type ProgramIdlPair } from './types';

/**
 * A program's IDL-derived names - its display name and its instruction-name resolver - or undefined when no
 * IDL names it.
 *
 * Undefined covers three cases: a non-anchor program, a program with no IDL, and a
 * program whose IDLs carry neither a metadata name nor a usable discriminator table.
 * @param url - The RPC URL to resolve against
 * @param programId - The program whose IDLs to read
 * @param backoffOptions - Retry configuration for handling RPC failures
 */
export async function resolveProgramIdlNames(
    url: string,
    programId: string,
    backoffOptions: BackoffOptions,
): Promise<ProgramIdlNames | undefined> {
    if (NON_ANCHOR_PROGRAMS.has(programId)) return undefined;

    const { abortSignal } = backoffOptions;
    // A fresh client per attempt, as before; the deadline is bound to each one.
    // So a fired signal also cancels the request a retry would otherwise leave running.
    const createRpc = () => (abortSignal ? createAbortableRpc(url, abortSignal) : createSolanaRpc(url));

    const idls = (await withBackoff(() => resolveProgramIdls(createRpc(), address(programId)), {
        ...backoffOptions,
        shouldRetry: backoffOptions.shouldRetry ?? isRetryableError,
    })) as ProgramIdlPair;

    return buildProgramIdlNames([idls.programMetadataIdl, idls.anchorIdl]);
}
