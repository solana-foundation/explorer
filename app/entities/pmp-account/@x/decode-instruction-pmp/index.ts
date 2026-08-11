// Cross-slice public API (FSD `@x`) that lets the `decode-instruction-pmp` feature reach `PMP_ADDRESS` without the
// generated client and pako, yaml and smol-toml - the feature's detection path runs on every instruction
// of every transaction, so that edge would cost ~35 kB gzip in the `/tx/*` first-load JS.
export { PMP_ADDRESS } from '../../lib/program-address';
