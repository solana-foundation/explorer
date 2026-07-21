# Development

## Running tests

From the repo root:

```sh
pnpm --filter @explorer/idl-decode configure   # full bootstrap: re-download vendored IDLs + generate
pnpm --filter @explorer/idl-decode generate    # offline: codama literals + typed clients, build dist
pnpm --filter @explorer/idl-decode test        # typecheck → unit → integration (over dist) → tree-shake → node-esm
pnpm --filter @explorer/idl-decode test:watch  # vitest watch mode (unit)
pnpm --filter @explorer/idl-decode typecheck   # tsc --noEmit (src/tests + build config)
```

`pretest` runs `generate` (offline, no network), so `test` self-prepares from committed sources —
`configure` additionally re-downloads the vendored wormhole IDLs and is for the occasional refresh,
not every run.

Running the suite needs **no** Rust/Anchor toolchain — specs read committed snapshots through the
`test-anchor-programs/` packages (`src/__tests__/fixtures.ts` wraps them as `load*` loaders):

- buildable packages — `.` → live `target/idl/*.json`; `./idl` → committed JSON; `./generated-types` → companion type module
- static snapshot packages — `.` and `./idl` → the same committed JSON

The toolchain below only **regenerates** snapshots after the `.rs` sources change.

## Building the fixture programs

`test-anchor-programs/` contains two real Anchor workspaces whose generated IDLs feed the test suite:

- `test-anchor-programs/simple` — anchor-lang 1.1.2
- `test-anchor-programs/simple-031` — anchor-lang 0.31.1

Both implement the same minimal program (one account, one instruction argument, one error, one event), so their IDLs are directly comparable across Anchor versions. Each Anchor package ships committed snapshot entries for test imports: `./idl` — the raw IDL JSON — and `./generated-types` — the generated Anchor companion type module.

The same directory also contains static Anchor snapshot packages for mainnet and stress fixtures (`amm-v3`, `dummy-transfer-hook`, `example-native-token-transfers`, `let-me-buy`, `ntt-transceiver`, `wormhole-governance`). These have no build script:

- *Wormhole-sourced packages* re-download their snapshots from the upstream repository (`homepage`) with `pnpm run download:idl` (root fan-out: `download:idls`). Sources are declared per file under `explorer.vendoredIdl`; JSON lands minified, companion `.ts` oxfmt'd.
- *The others* are edited directly when refreshing.
- Variant IDLs are exposed with named subpaths such as `./pmp-idl`, `./legacy-idl`, and `./codama`.
- Each package's `description` says what it snapshots.

Anchor fixture packages that need a committed Codama literal opt in with `explorer.codamaFromAnchor` in their `package.json`. Regenerate all opted-in literals from the root package:

```sh
pnpm --filter @explorer/idl-decode run generate:anchor-codama
```

or regenerate one package:

```sh
pnpm --filter @explorer/test-idl-program-example-native-token-transfers run generate:codama
```

`test-codama-programs/` holds Codama fixtures that need no build — plain data consumed directly.
Packages ship `./idl` — the raw JSON root node for wide (runtime-shaped) specs — and, where a
literal type drives the inference specs, `.` — an `as const` TS module (`tokenkeg` is raw-JSON-only).
The JSON is the source of truth: the literal module is generated from it by
`scripts/generate-codama-literals.mjs` (`pretest` re-runs it), so edits go into the JSON only.
Each package's `description` says what it snapshots.

Ready-made IDLs also come from the `codama-fixtures` devDependency (a pinned tarball of the codama repo): functional specs import its `dynamic-client` test IDLs as-is, and `scripts/generate-codama-types.mjs` renders typed clients from them into `__tests__/generated/`.

Prerequisites:

- Rust toolchain
- Solana CLI (agave 2.2.x)
- Anchor CLI managed by [avm](https://www.anchor-lang.com/docs/installation) — each program workspace pins its CLI via `anchor_version` in its `Anchor.toml`, and the `anchor` binary switches (and auto-installs) the version per workspace

Build both programs:

```sh
pnpm --filter @explorer/idl-decode build:programs
```

or one at a time:

```sh
pnpm --filter @explorer/test-idl-program-simple run build:anchor
pnpm --filter @explorer/test-idl-program-simple-031 run build:anchor
```

The script is named `build:anchor` (not `build`) on purpose: the root `build:packages` runs
`pnpm -r run build` across `packages/**`, and a `build` script here would drag the Rust/Anchor
toolchain into every standard build (CI included).

`build:programs` compiles each workspace into `target/idl/*.json` + `target/types/*.ts` (both gitignored) and copies them into the committed snapshots (via `test-anchor-programs/copy-anchor-artifacts.mjs`) — a standalone regeneration step, never part of the test pipeline. Commit the refreshed snapshots; the suite reads those, not the live `target/`. To refresh one Anchor package after building it, run its `copy:artifacts` script.

### Gotchas

- `test-anchor-programs/simple-031/Cargo.lock` carries deliberate downgrades (`blake3`, `proc-macro-crate`, `indexmap`, `jobserver`, `unicode-segmentation`, `zeroize_derive`, `syn`): the cargo bundled with Solana platform tools (1.84) cannot parse `edition2024` manifests. A bare `cargo update` in that workspace will re-break the build.
- Program keypairs live in gitignored `target/deploy/`. A fresh clone regenerates them, so `anchor build` will report a program ID mismatch — run `anchor keys sync` in the affected workspace (via `pnpm --filter <pkg> exec anchor keys sync`) and rebuild.
