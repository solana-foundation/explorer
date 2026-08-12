/**
 * The newest transaction version Explorer asks the RPC for.
 *
 * Without it the RPC answers `-32015` for anything newer than legacy and the transaction fails to
 * load at all. Nodes that predate v1 compare this ceiling against the versions they actually hold,
 * so requesting 1 is safe against them.
 */
export const MAX_SUPPORTED_TRANSACTION_VERSION = 1;
