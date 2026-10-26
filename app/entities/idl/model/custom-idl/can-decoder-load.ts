import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Program } from '@coral-xyz/anchor';
import { getValidationItemsVisitor, visit } from 'codama';

import { type AnchorIdl, type CodamaIdl, type TaggedIdl } from '../../lib/types';
import { getProvider } from '../anchor/anchor-provider';
import { formatSerdeIdl } from '../formatters/format';
import { buildProgramIdlNames } from '../instruction-name-table';

export function canDecoderLoad(tagged: TaggedIdl, programAddress: string): boolean {
    if (!canBuildNames(tagged.idl)) return false;
    if (tagged.standard === 'Codama') return hasNoValidationErrors(tagged.idl);
    return canBuildAnchorProgram(tagged.idl, programAddress) || canConvertToCodama(tagged.idl, programAddress);
}

function canBuildNames(idl: AnchorIdl | CodamaIdl): boolean {
    try {
        buildProgramIdlNames([idl]);
        return true;
    } catch {
        return false;
    }
}

function hasNoValidationErrors(root: CodamaIdl): boolean {
    try {
        return visit(root, getValidationItemsVisitor()).every(item => item.level !== 'error');
    } catch {
        return false;
    }
}

const UNUSED_RPC_URL = 'http://localhost:8899';

function canBuildAnchorProgram(idl: AnchorIdl, programAddress: string): boolean {
    try {
        new Program(formatSerdeIdl(idl, programAddress), getProvider(UNUSED_RPC_URL));
        return true;
    } catch {
        return false;
    }
}

function canConvertToCodama(idl: AnchorIdl, programAddress: string): boolean {
    try {
        return rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]).program.publicKey === programAddress;
    } catch {
        return false;
    }
}
