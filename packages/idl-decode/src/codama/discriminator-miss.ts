import { getLastNodeFromPath } from 'codama';

import { identifyAccountData, identifyEventData, identifyInstructionData } from '@codama/dynamic-parsers';

type IdentifyPath = ReturnType<typeof identifyAccountData | typeof identifyEventData | typeof identifyInstructionData>;

// `parseData` in @codama/dynamic-parsers wraps the codec decode in try/catch and returns `undefined`
// on a throw, so a parse miss means EITHER "no discriminator matched" OR "a discriminator matched but
// the body would not decode". When identification lands on a node that carries a discriminator, the
// second case holds — a real decode failure the caller must surface, not a silent miss. A match on a
// discriminator-less node is codama's single-candidate guess (e.g. SPL Memo), which stays a plain miss.
//
// TODO(https://github.com/codama-idl/codama/issues/NNNN): remove this re-identification once
// dynamic-parsers distinguishes a decode throw from a discriminator miss (see .github/upstream/
// dynamic-parsers-parsedata-swallows-throw.md). Drop the identify* re-run and treat every miss plainly.
export function isDecodeFailureMiss(path: IdentifyPath): boolean {
    if (!path) return false;
    // eslint-disable-next-line typescript/consistent-type-assertions -- account/instruction/event nodes carry optional discriminators the path type does not narrow to
    const node = getLastNodeFromPath(path) as { discriminators?: readonly unknown[] };
    return (node.discriminators?.length ?? 0) > 0;
}
