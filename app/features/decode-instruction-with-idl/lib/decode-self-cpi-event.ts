import { type InstructionArg, parseCodamaArgs } from '@entities/instruction-card';
import { decodeEventWithIdl } from '@explorer/idl-decode/codama';
import { instructionIsSelfCPI } from '@utils/anchor';
import { capitalizeFirstLetter } from '@utils/index';
import { getLastNodeFromPath, type RootNode } from 'codama';

export type SelfCpiEventDecode = { args: readonly InstructionArg[]; name: string; programName: string };

// Anchor `emit_cpi!` emits an event as a self-CPI: the instruction data is the 8-byte anchor-event tag
// followed by the event's own [discriminator + borsh payload]. Decode that payload as an event through the
// codama root (nodes-from-anchor >= 1.5 carries events) so legacy programs surface emit_cpi events without
// a built anchor Program — the codama counterpart to the self-CPI branch in decodeAnchorInstruction.
export function decodeSelfCpiEvent(data: Uint8Array, root: RootNode): SelfCpiEventDecode | undefined {
    if (!instructionIsSelfCPI(data)) return undefined;
    const decoded = decodeEventWithIdl(root, data.slice(8));
    if (decoded.kind === 'unknown') return undefined;
    const node = getLastNodeFromPath(decoded.decoded.path);
    return {
        args: parseCodamaArgs(decoded.decoded.data),
        name: node.kind === 'eventNode' ? node.name : 'event',
        programName: capitalizeFirstLetter(root.program.name),
    };
}
