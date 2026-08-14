// The FULL surface: `PmpAccountCard` reaches `@entities/pmp-account`, which pulls the generated client along with
// pako, yaml and smol-toml. Safe here because the only consumer is the `/address/[address]/account-data` route
// segment, which Next code-splits into its own chunk. Do not import this from a module that runs on every page -
// `app/address/[address]/layout.tsx` uses the entity's light predicates directly for exactly that reason.
export { PmpAccountCard } from './ui/PmpAccountCard';
