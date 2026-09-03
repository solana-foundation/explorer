import { asRecord } from './parse-helpers.js';

/** An error reduced to what a log line needs. `code` appears only when the error carries a numeric one. */
export type LoggedError = {
    code?: number;
    message: string;
    name: string;
};

/**
 * Reduces any thrown value to its own `name`/`message`, dropping the `cause` chain.
 *
 * A transport `cause` carries the key-bearing RPC endpoint's host (`getaddrinfo ENOTFOUND <host>`),
 * and console logging walks the whole chain — so no log site may pass a raw upstream error.
 *
 * @example Every logger call sanitises the error it carries
 * ```ts
 * logger.warn(ns('idl client resolution failed'), { error: toLoggedError(error), programAddress });
 * ```
 */
export function toLoggedError(error: unknown): LoggedError {
    if (!(error instanceof Error)) {
        return { message: String(error), name: 'NonError' };
    }
    const code = asRecord(error)?.code;
    return {
        message: error.message,
        name: error.name,
        ...(typeof code === 'number' ? { code } : {}),
    };
}
