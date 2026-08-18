# Proposal: Ask before connecting to an RPC endpoint a link supplied

## Context

`?cluster=custom&customUrl=https://any.host/rpc` connects with no question asked. `isCustomUrlAllowed` treats `cluster === Custom` as evidence the user chose the endpoint — but a link sets the cluster, so it never was evidence. A visitor who opens a shared link sends every address, transaction and block they browse to a node the sender picked, and the page looks normal throughout.

The only other trust input was `WHITELISTED_RPCS`, a one-entry host list in `resolve-cluster.ts`. Only a source change could alter it, so a deployment could neither vouch for its own hosts nor drop someone else's.

## Why

The param has to stay: pointing the Explorer at a local validator or a private node is what it is for, and the query string is the only source for the endpoint, which is what keeps a custom cluster shareable. So the fix is not to restrict who may write the URL — anyone may — but to stop treating "a URL arrived" as "the user agreed to it".

Alternatives considered:

- **Refuse anything not whitelisted.** Kills the local-validator and private-node workflows the param exists for, and pushes users onto a deployment-level list for a personal choice. Consent keeps both at one click.
- **Keep consent in memory only.** Correct in spirit, unusable in practice: the endpoint stays in the address bar, so every refresh of a custom-cluster page asks again. `sessionStorage` keeps the property that matters — consent dies with the tab — without charging for a reload.
- **Persist consent to `localStorage`.** A standing permission nobody remembers granting is the thing being defended against, and it would need a surface to review and revoke. Tab-scoped needs neither: a link opened tomorrow starts clean.
- **Two outcomes — honor or fall back.** A refused endpoint would connect somewhere the URL does not name, and the user would never learn why the data looks wrong. A third outcome, `pending`, makes the refusal a question instead of a silent substitution.
- **Keep the whitelist in source.** Who a deployment vouches for is the operator's call, not this source tree's.

## What Changes

- **`decideCustomUrl` replaces `isCustomUrlAllowed`**, returning `honored | pending | refused`. Honored for the persisted developer flag, a local endpoint (a link there reaches nothing its sender can read back), a hostname the deployment whitelisted, or an origin approved this session. Non-http(s) is refused. Everything else is `pending`. The active cluster is no longer an input.
- **Nothing connects while pending.** `ClusterProvider` passes a null SWR key, so status stays Connecting, and `PendingCustomUrlConsent` — mounted app-wide, because the question arrives with the page — asks. Declining replaces the URL with the default cluster.
- **Consent is per origin and scoped to the tab**, held in `sessionStorage`. A rotated API key or a different path is the same server, so it must not ask twice. It survives a reload — the endpoint is still in the address bar — and dies when the tab closes.
- **`NEXT_PUBLIC_WHITELISTED_RPCS` replaces the hardcoded list.** Empty by default; invalid entries are skipped with a warning rather than dropping the rest.
- **`RpcEndpoint` becomes the boundary type**, built only by `parseRpcEndpoint`, so the one parse of an inbound endpoint is shared instead of repeated per consumer. `ClusterSelection` binds cluster and endpoint into one value so the two cannot disagree.
- **The navbar marks a remote custom endpoint in amber.** Consent is a one-time question; which node the app is talking to is a standing fact, and until now nothing on screen carried it. A connected third-party endpoint drew the same green pill as mainnet-beta, and the label truncates inside a 210px slot, so a host like `api.mainnet-beta.solana.com.example.net` read as the official one. The icon keeps status (spinner / tick / alert) and the colour now carries provenance. A local validator is not marked — it is not what we warn about — and Failure stays red, being the more urgent fact.
- **Navigation keeps a `customUrl` whenever it parses** (`isCustomUrlCarryable`). Trust is deliberately not part of that question: a pending endpoint must survive in-app clicks, or the prompt loses the endpoint it is asking about.
- **The switcher UI moves to `app/features/cluster-switcher/`**; `app/entities/cluster/` keeps the cluster domain, per FSD.

## Impact

- **Behaviour** — a link carrying an unknown remote endpoint now prompts before anything connects. Local endpoints, whitelisted hosts and the developer flag stay silent, as today. Declining lands on mainnet-beta. A remote custom endpoint stays amber in the navbar for as long as it is in use.
- **Deployments** — set `NEXT_PUBLIC_WHITELISTED_RPCS` to keep a host silent that the source list covered before. `engine.mirror.ad` was its only entry and is no longer in the tree.
- **Supersedes** decision 4 of `keep-custom-url-off-our-server`: `isCustomUrlAllowed` is gone, and that proposal's two references to the hardcoded host are edited out so its text matches the code.
- **Files** — `entities/cluster/lib/{rpc-endpoint,whitelisted-rpcs,resolve-cluster}.ts`, `entities/cluster/model/{approved-origins,custom-url-enabled,use-cluster-url,cluster-provider}`, the new `features/cluster-switcher/` slice, and `.env.example`.
- **Accepted risk** — consent survives a reload, so an approval granted in a tab outlives the page that asked for it. Bounded by the tab: closing it clears the list, and a new tab asks again. A duplicated or session-restored tab inherits the approvals, which is the one case where consent appears without a click in that window.
