import { getValidationItemsVisitor, visit } from 'codama';

import { type CodamaIdl, type TaggedIdl } from '../../lib/types';
import { buildAnchorProgram } from '../anchor/build-anchor-program';
import { convertAnchorToCodama } from '../converters/convert-anchor-to-codama';
import { buildProgramIdlNames } from '../instruction-name-table';

// The Program constructor requires a provider. canDecoderLoad sends no request to this URL.
const UNUSED_RPC_URL = 'http://localhost:8899';

export function canDecoderLoad(tagged: TaggedIdl, programAddress: string): boolean {
    if (!succeeds(() => buildProgramIdlNames([tagged.idl]))) return false;
    if (tagged.standard === 'Codama') return hasNoValidationErrors(tagged.idl);
    return (
        succeeds(() => buildAnchorProgram(tagged.idl, programAddress, UNUSED_RPC_URL)) ||
        convertAnchorToCodama(tagged.idl)?.program.publicKey === programAddress
    );
}

function hasNoValidationErrors(root: CodamaIdl): boolean {
    return succeeds(() => visit(root, getValidationItemsVisitor()).every(item => item.level !== 'error'));
}

function succeeds(check: () => unknown): boolean {
    try {
        return check() !== false;
    } catch {
        return false;
    }
}
