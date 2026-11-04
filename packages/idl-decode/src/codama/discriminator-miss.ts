import { identifyAccountData, identifyEventData, identifyInstructionData } from '@codama/dynamic-parsers';

type IdentifyPath = ReturnType<typeof identifyAccountData | typeof identifyEventData | typeof identifyInstructionData>;

// `parseData` in @codama/dynamic-parsers wraps the codec decode in try/catch and returns `undefined`
// on a throw, so a parse miss means EITHER "no discriminator matched" OR "a discriminator matched but
// the body would not decode". When identification lands on a node that carries a discriminator, the
// second case holds — a real decode failure the caller must surface, not a silent miss. A match on a
// discriminator-less node is codama's single-candidate guess (e.g. SPL Memo), which stays a plain miss.
//
// TODO(https://github.com/codama-idl/codama/issues/NNNN): remove this re-identification once
// dynamic-parsers distinguishes a decode throw from a discriminator miss. Drop the identify* re-run and
// treat every miss plainly.
export function isDecodeFailureMiss(path: IdentifyPath): boolean {
    if (!path) return false;
    // identify* returns a NodePath ending in the matched account/instruction/event node; that last node's
    // discriminators decide a decode failure vs a plain miss. Read it by index rather than
    // getLastNodeFromPath, whose `<TNode extends Node>` signature cannot infer a single TNode across the
    // three-path union (indexing keeps each arm's `Node` element type). All three node kinds carry an
    // optional `discriminators` array the `Node` union does not surface, so view the node structurally —
    // safe because only those kinds reach here, and a missing/empty array simply yields 0.
    // eslint-disable-next-line typescript/consistent-type-assertions -- structural view of a discriminator-bearing node; the Node union does not expose the optional field
    const node = path[path.length - 1] as { discriminators?: readonly unknown[] };
    return (node.discriminators?.length ?? 0) > 0;
}
