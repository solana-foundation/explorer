# Proposal: Tag slice output with its parser so cards take the slice type

## Why

The dispatcher returns the RPC's own object when a slice rejects it. That object has the same `program` label as slice output, and `ParsedInstruction.parsed` is typed `any`. A card cannot tell the two apart, so the System card ran every payload through the slice's schemas a second time. `unify-instruction-parsing` accepted that second check as transitional debt.

The dispatcher knows which parser produced a payload. If the dispatcher records that parser on the result, one identity check proves the payload's type.

### Alternatives considered

- **Keep the check in each card.** Rejected. Two places decide whether a payload is valid.
- **Return `UnparsedInstruction` when a slice rejects RPC input.** Rejected. `parsed` stays `any`, so each card still needs a cast. A rejected Token payload also stops reaching `TokenDetailsCard`, which parses that payload itself.
- **Type `parsed` by program label in the router.** Rejected. The cast is wrong for a dispatcher that registers a different parser under the same label.
- **Tag the result with the parser and narrow by identity (chosen).** Only the dispatcher sets the tag. The RPC pass-through keeps its reference, so cards without a slice do not change. The cost: `isParsedBy` compares object identity, so the router must import the parser object that the dispatcher registered. A dispatcher that registers a different System parser object renders the Unknown card for every System instruction, and the router reports each one to Sentry.

## What Changes

- `@explorer/parsers` adds `SliceParsedInstruction<P>`: a `ParsedInstruction` with `parsed: P` and the `parser` that produced it. Both dispatcher paths return it for slice output.
- `@explorer/parsers` adds `isParsedBy(result, parsers)`, which narrows `parsed` to the slice's type.
- `toParsedInstruction` is deleted.
- The router adds a `parsedBy(parsers, Card)` route. The System card uses it, takes `SystemParsed`, and does not check it.

## Impact

- An RPC payload that the System slice rejects shows the Unknown card and reaches Sentry, as before. Before this change the System card threw on the payload. Now the `parsedBy` route throws, so the router's error boundary renders the Unknown card and sends the error to Sentry.
- A System RPC instruction with a type that the slice does not list also reaches Sentry. Before this change the System card rendered the Unknown card for that type without a report.
- Supersedes the "Dispatcher routes through the shared wrap" scenario of `unify-instruction-parsing`, under its requirement "Compat layer is transitional". That scenario says the wrap MUST come from `toParsedInstruction`, and the requirement names `toParsedInstruction` as the only permitted bridge. This change deletes `toParsedInstruction`, and the dispatcher builds the result itself.
- Supersedes one clause of the requirement "Per-program parser slices" of `unify-instruction-parsing`, for the System program only. That clause says each slice at `app/features/decode-instruction-<program>/` exposes an `InstructionParser<P>` value. `app/features/decode-instruction-system` exports only `SystemDetailsCard`. `systemInstructionParser` is exported from `@explorer/parsers/programs/system`, so the router and the dispatcher import the same parser object.
- Archive order: `unify-instruction-parsing` is archived first, which creates the `instruction-parser` base spec. This delta then adds `## MODIFIED Requirements` that restates "Compat layer is transitional" in full without that scenario, before it is archived. Until then both changes are open and the overlap is recorded here only.
- Every other card keeps its current route. Each can move to `parsedBy` with no dispatcher change.
