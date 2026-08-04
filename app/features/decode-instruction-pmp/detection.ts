/**
 * The feature's LIGHT public entry point, for surfaces that only need to recognise a PMP instruction.
 *
 * Everything reachable from here is library-free, so importing it costs a string compare. `index.ts` re-exports
 * the decode modules and the card, which pull the generated client (and with it pako, yaml and smol-toml), so a
 * consumer that statically imported the guard from there would drag that whole stack into its first-load JS.
 * Same split as `@explorer/decoder-serum/detection` next to `@features/instruction-program-serum`.
 */
export { isProgramMetadataInstruction } from './lib/is-program-metadata-instruction';
export { PMP_ADDRESS } from './lib/program-address';
