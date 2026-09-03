# Firewall

WAF config lives in the [firewall dashboard](https://vercel.com/solana-foundation/explorer/firewall), not the repo;
`vercel.json` was removed in favour of it (`d51617c86`). Never add tokens, project or team IDs, or the Protection
Bypass for Automation secret here.

## Rules to configure

Bot Filter is active at `challenge`, so anything Vercel cannot identify as a browser gets `429` +
`x-vercel-mitigated: challenge`. Each rule below exempts something that breaks under it, and all seven must exist in
the dashboard. This is the **target** set, and live config matches it — `Rate limit MCP` sits disabled by design,
switched on only during a spike.

| Rule                                       | Covers                    | Without it                                                                            | Fields                            |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `Allow static assets`                      | root icons, manifest      | Tab icons, PWA install, and the site preview all fail                                 | [below](#rules-to-configure)      |
| `Bypass crawler files`                     | robots and sitemaps       | Unverified crawlers and SEO tooling cannot read either                                | [below](#rules-to-configure)      |
| `Bypass OG image routes`                   | all of `/og/`             | Link previews render blank — crawlers cannot solve a challenge                        | [`app/og`](../app/og/README.md)   |
| `Bypass receipt view of transaction pages` | `/tx/` + `view=receipt`   | Shared receipt links do not unfurl — the crawler fetches the page, not just the image | [below](#rules-to-configure)      |
| `Bypass feature gate pages`                | `/address/…/feature-gate` | Shared feature gate links do not unfurl, for the same reason                          | [below](#rules-to-configure)      |
| `Bypass MCP endpoint`                      | `/mcp`                    | Unreachable to every MCP client                                                       | [`app/mcp`](../app/mcp/README.md) |
| `Rate limit MCP` (disabled)                | `/mcp`                    | No way to throttle a spike without closing the endpoint                               | [`app/mcp`](../app/mcp/README.md) |

Names lead with what the rule does, so the dashboard list shows which rules are holes — the ones to review or toggle
during an incident — without opening each one. Verify any of them with
`curl -o /dev/null -w '%{http_code} %header{x-vercel-mitigated}\n' <url>`; an empty header means a bypass matched.

These four have no endpoint README to live in. The first two cover `public/` files, fetched without page credentials,
so Bot Filter challenges them.

```
Name: Allow static assets
Description: Bot protection blocks static asset fetches, issued without page credentials: `^/favicon\.(ico|svg|png)$`, `^/icon-(maskable-)?[0-9]+\.png$`, `^/apple-touch-icon\.png$`, `^/opengraph-image\.png$`, `^/manifest\.json$`
Rule:
    If `Request Path` `Matches` `^/favicon\.(ico|svg|png)$`
    OR `Request Path` `Matches` `^/icon-(maskable-)?[0-9]+\.png$`
    OR `Request Path` `Equals` `/apple-touch-icon.png`
    OR `Request Path` `Equals` `/opengraph-image.png`
    OR `Request Path` `Equals` `/manifest.json`
    Then `Bypass`
```

`/manifest.json` and the twelve `icon-*.png` files are the PWA install set, referenced from `manifest.json` itself.
`/opengraph-image.png` is a static file, not something `/og/` renders.

Both regexes are anchored and escape the dot on purpose. `Starts with /favicon` would also match `/faviconfoo`, and
an unescaped `.` matches any character — the mistake that produced the `/og/*` hole. Verify a pattern before applying
it: `ls public/ | sed 's|^|/|' | pcre2grep '<pattern>'`.

```
Name: Bypass crawler files
Description: Crawlers cannot solve a challenge: `^/robots\.txt$`, `^/sitemap\.xml$`, `^/default-sitemap\.xml$`, `^/accounts-sitemap\.xml$`
Rule:
    If `Request Path` `Equals` `/robots.txt`
    OR `Request Path` `Equals` `/sitemap.xml`
    OR `Request Path` `Equals` `/default-sitemap.xml`
    OR `Request Path` `Equals` `/accounts-sitemap.xml`
    Then `Bypass`
```

Bot Filter auto-allows Vercel's verified-bot directory, so Googlebot may already reach these — verification is by IP,
not user-agent, so that cannot be tested from here. Unverified crawlers and SEO tooling are challenged today.

```
Name: Bypass receipt view of transaction pages
Description: Receipt is an alternative view of the /tx/ page, not its own route; social crawlers unfurl it: `^/tx/.*?view=receipt`
Rule:
    If `Request Path` `Starts with` `/tx/`
    AND `Query` `view` `Equals` `receipt`
    Then `Bypass`
```

```
Name: Bypass feature gate pages
Description: Social crawlers unfurl feature gate links but cannot solve a challenge: `^/address/[^/]+/feature-gate/?$`
Rule:
    If `Request Path` `Matches` `^/address/[^/]+/feature-gate/?$`
    Then `Bypass`
```

Both are pages, not images. `Bypass OG image routes` already serves `/og/receipt/` and `/og/feature-gate/`, but a
crawler reaches those only after reading `og:image` off the page — so without these two the preview never starts.
Anchored at both ends because `Starts with /address/` would exempt every account page.

`getFeatureGateOpenGraph` also sets `og:image` on the bare `/address/<addr>`, which no rule covers. Scoping one to it
means exempting all account pages; redirect that form to `/feature-gate` instead if the short link matters.

## Under attack

Stop at the first step that holds. Rollback at any point: dashboard → ⋯ → **View Audit Log → Restore**, instant, no
redeploy.

1. **Confirm it is the WAF.** `429` + `x-vercel-mitigated` is the WAF; JSON `401`/`403`/`503` is the route's own
   gates; `200` carrying `errors[].code = source_unavailable` is upstream RPC.
2. **Enable `Rate limit MCP`.** It ships disabled, so `/mcp` is unmetered until you switch it on: 100 req/60s per IP,
   `429` above that, then 30 req/60s with `Deny` for 10 minutes. Never disable `Bypass MCP endpoint` as a throttle;
   that closes `/mcp` outright. Ladder in [`app/mcp`](../app/mcp/README.md).
3. **Raise Bot Filter** `log` → `challenge`. Bypassed paths stay up: they match at Custom Rules, Bot Filter runs
   after.
4. **Attack Mode**, last. ACM runs _before_ custom rules, so no rule can exempt a path — `/mcp` and every link
   preview ([`app/og`](../app/og/README.md)) go dark with it.

If `/mcp` must survive step 4: a system bypass covers IPs or CIDRs only — a load generator or fixed-egress partner,
never public traffic — and skips every check including the rate limit; it is untested against ACM, so try it on a
throwaway project. A separate Vercel project works because ACM is project-scoped and same-account cross-project
requests pass as internal. Otherwise accept the outage — `/mcp` is deliberately public, so `Rate limit MCP` is the
only control on it and there is no key to fall back on.

## How evaluation works

Stage order: System Rules → **Attack Challenge Mode** → Custom Rules → Managed Rulesets → Routing. Bot Filter is a
managed ruleset and custom rules run before it, which is why a plain `Bypass` clears it. ACM runs _before_ custom
rules, which is why no rule can exempt a path from it — `bypassSystem` reaches back to System Rules at most.

Within custom rules, evaluation runs top to bottom. `Deny` and `Challenge` stop it, `Log` continues, `Rate Limit`
continues until the limit trips, and `Bypass` skips every remaining custom rule and all managed rulesets. So:

- A `Bypass` above another rule on the same path disables it — this is why a rate limit sits above its bypass.
- `Rate Limit` is not a bypass: under the limit the request still reaches Bot Filter and is challenged.
- `Bypass` works on serverless routes, not just static assets — `GET /og/feature-gate/<address>` reaches its handler.
- `Log` does not clear a challenge — only `Bypass` exempts a path. Tested 2026-09-03: a `Log` rule on `path pre /mcp`
  left `POST /mcp` at `429 [challenge]`, refuting the support claim that `Log` terminates evaluation.
- `Log` as a rate-limit exceed action counts without blocking — for sizing a limit against live traffic, not for
  enforcing.

### Operators

[Full list](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration#operators). OR conditions become
separate condition groups, AND conditions share one. All operators are case insensitive, and `Matches` is
[PCRE](https://www.pcre.org/current/doc/html/pcre2pattern.html), not glob — unanchored without a leading `^`, with
`*` and `+` quantifying the preceding atom. Prefer `Starts with` or `Equals`.

## BotID cannot substitute

`proxy.ts` and `config/botid-middleware.mjs` configure Vercel BotID in application code, for `/api/*` only. It detects
and blocks bots; it grants nothing. The WAF runs at the edge, so a challenged request never reaches it, and
`botIdMiddleware` returns early without an `x-is-human` header — which no non-browser client sends. `/mcp` sits
outside `/api/*` to stay out of that matcher.
