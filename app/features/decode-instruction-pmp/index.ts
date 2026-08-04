// The FULL surface, which pulls the generated client and pako. Consumers that only recognise a PMP instruction
// must import from `./detection` instead, and reach the card through `dynamic(() => import(...))`, so this weight
// stays out of the `/tx/*` first-load JS. See `detection.ts`.
export { isProgramMetadataInstruction, PMP_ADDRESS } from './detection';
export { decodePmpBufferAccount } from './lib/decode-pmp-buffer-account';
export { decodePmpContentInstruction } from './lib/decode-pmp-instruction';
export { decodePmpPayload } from './lib/decode-pmp-payload';
export type {
    PmpAccountContent,
    PmpAccountSnapshot,
    PmpContentInstruction,
    PmpDecodeConfig,
    PmpDecodedPayload,
} from './lib/types';
export { PmpDetailsCard } from './ui/PmpDetailsCard';
