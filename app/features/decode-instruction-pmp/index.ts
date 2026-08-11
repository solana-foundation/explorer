// The FULL surface, which pulls the generated client and pako. Consumers that only recognise a PMP instruction
// must import from `./detection` instead, and reach the card through `dynamic(() => import(...))`, so this weight
// stays out of the `/tx/*` first-load JS. See `detection.ts`.
export { isProgramMetadataInstruction } from './detection';
export { decodePmpContentInstruction } from './lib/decode-pmp-instruction';
export type { PmpContentInstruction } from './lib/types';
export { PmpDetailsCard } from './ui/PmpDetailsCard';
