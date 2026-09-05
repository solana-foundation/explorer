# OG image routes

`app/og/` holds the OG image routes: `receipt/[signature]` and `feature-gate/[address]`.

## Firewall

Social crawlers are non-browser clients, so previews and unfurls fail without these rules. Add them in the
[firewall dashboard](https://vercel.com/solana-foundation/explorer/firewall) → ⋯ → Configure → **Add New… → Rule**;
semantics in [`docs/firewall.md`](../../docs/firewall.md). End every description with the paths it matches, written
as the equivalent regex — `^` for `Starts with`, `^…$` for `Equals`. The dashboard list shows descriptions but not
conditions, so this is the only place the operator is visible without opening the rule.

One rule covers every route under `/og/`, including any added later.

```
Name: Bypass OG image routes
Description: Bypass Bot Protection for OG image routes: `^/og/`
Rule:
    If `Request Path` `Starts with` `/og/`
    Then `Bypass`
```

⚠️ `Starts with`, never `Matches`: the previous `/og/*` was PCRE rather than a glob, so `*` quantified the preceding
`/` and the unanchored `/og` exempted every path containing it, `/address/ogAbC…` included.

Unfurling a receipt link also needs the receipt view of the `/tx/` page, which is a separate rule in
[`docs/firewall.md`](../../docs/firewall.md).

### To apply

Delete `Allow bots for OG images` (`Starts with` `/og/receipt/`) — redundant once the rule above uses the `/og/`
prefix, and unreachable while it sits below it.

## Environment

Receipt keys, documented inline in [`.env.example`](../../.env.example): `NEXT_PUBLIC_RECEIPT_ENABLED`,
`RECEIPT_CLUSTER_PROBE_ENABLED`, `RECEIPT_BASE_URL`, `RECEIPT_OG_IMAGE_VERSION`, `RECEIPT_CACHE_HEADERS`, and
`NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS`.
