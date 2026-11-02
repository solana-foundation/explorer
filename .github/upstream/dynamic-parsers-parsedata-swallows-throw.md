# Upstream issue draft — @codama/dynamic-parsers `parseData` swallows codec errors

**Repo:** https://github.com/codama-idl/codama
**Package:** `@codama/dynamic-parsers` (observed on 1.4.2)
**File when raised:** needs a real issue URL — update the `TODO(...)` in
`packages/idl-decode/src/codama/discriminator-miss.ts` once filed.

## Title

`parseData`/`parseAccountData`/`parseInstruction`/`parseEventData` return `undefined` for a matched-discriminator decode failure, hiding codec errors

## Summary

`parseData` identifies the node by discriminator and then decodes its body inside a `try/catch` that
returns `undefined` on any throw:

```js
function parseData(root, bytes, kind, options = {}) {
  const path = identifyData(root, bytes, kind ?? [...], options);
  if (!path) return void 0;
  const codec = getNodeCodec(path);
  try {
    return { data: codec.decode(bytes), path };
  } catch {
    return void 0;          // <-- a decode throw is indistinguishable from a discriminator miss
  }
}
```

So a caller cannot tell these two cases apart:

1. **Discriminator miss** — no node matched the leading bytes. `undefined` is correct.
2. **Decode failure** — a discriminator matched, but `codec.decode` threw (truncated/corrupt body, a
   codec bug, an IDL that disagrees with the on-chain layout). `undefined` here is wrong: the error is
   swallowed and the caller reports "nothing to decode" instead of a real failure.

## Impact

Downstream decoders that want to report decode failures (e.g. to Sentry) lose the signal: a
discriminator-matched instruction/account/event with a bad body silently reads as a plain miss. Our
workaround re-runs `identify*` after a `parse*` miss and treats a match on a discriminator-bearing node
as a failure — an extra identification pass purely to recover information `parse*` already had.

## Reproduction

Decode an Anchor account/instruction with its correct 8-byte discriminator followed by a truncated
body: `parseAccountData` returns `undefined` rather than surfacing the `codec.decode` throw.

## Suggested fix

Return a discriminated result (or a typed error) that separates "no match" from "matched but failed to
decode" — e.g. `{ ok: false, path, error }` on a decode throw — or expose an option to rethrow. Either
lets callers distinguish a miss from a failure without a second `identify*` pass.
