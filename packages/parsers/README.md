# @explorer/parsers

Instruction-parsing contract shared by the explorer app and sibling packages: the
`InstructionParser` interface, the `createInstructionParserDispatcher` factory (dual-path — raw
kit-shaped bytes via `fromTransaction`, RPC-pre-parsed instructions via `fromParsed`), and the
`KitInstruction` shape parsers implement against.

The transitional pieces — `toParsedInstruction`/`toParsedTransaction` shims and the web3.js ↔ kit
conversions (`toKitInstruction`, `toLegacyPublicKey`, `toKitAddress`) — live in the separate
`@explorer/parsers/compat` entry. New code should build against the root contract and not depend
on `/compat`; it exists for consumers not yet on kit shapes and shrinks as they migrate.

The design and rationale live in the OpenSpec proposal
[`unify-instruction-parsing`](../../openspec/changes/unify-instruction-parsing/proposal.md) —
one parser per program, one canonical `SliceParsed` shape, one place to add a program. This package
hosts the _contract_; the per-program parser slices (`app/features/decode-instruction-*`) and the
React provider stay in the app.

Not to be confused with the per-program `@explorer/decoder-serum` / `@explorer/decoder-mango`
packages: those decode one protocol each, this package carries the generic parsing contract they
and the app slices plug into.
