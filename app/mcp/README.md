# `/mcp` endpoint

MCP server serving the `@explorer/entity-inspector` tools over the
[Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http).
Stateless — a fresh server per request — so it is serverless-safe. Lives at `/mcp` (not `/api/*`) to escape the BotID
proxy matcher.

## Enabling

Inert by default (`503`). Env-only configuration (see `.env.example`):

| Variable                          | Purpose                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `MCP_ENDPOINT_ENABLED`            | `true` enables the endpoint.                                                                                     |
| `MCP_ACCESS_KEYS`                 | Comma-separated bearer keys; requests need `Authorization: Bearer <key>`. Unset = open access (startup warning). |
| `MCP_BLOCKED_IPS`                 | Comma-separated client IPs rejected with 403.                                                                    |
| `MCP_SOLANA_RPC_URL_MAINNET_BETA` | Dedicated mainnet-beta RPC endpoint, keeping MCP traffic off the app's quota. Falls back to `MAINNET_RPC_URL`.   |
| `MCP_SOLANA_RPC_URL_DEVNET`       | Dedicated devnet RPC endpoint. Falls back to `DEVNET_RPC_URL`.                                                   |
| `MCP_SOLANA_RPC_URL_TESTNET`      | Dedicated testnet RPC endpoint. Falls back to `TESTNET_RPC_URL`.                                                 |
| `MCP_SOLANA_RPC_URL_SIMD296`      | Dedicated simd296 RPC endpoint. Falls back to `SIMD296_RPC_URL`.                                                 |

Keys and blocklist are parsed at module scope — changes require a redeploy.

## Enabled clusters

`app/shared/config/mcp-clusters.ts` holds `MCP_ENABLED_CLUSTER_NAMES`, the cluster names the tool advertises and
accepts. It is passed to the handler as `enabledClusterNames`, so the `cluster` enum, the tool description and the
landing page all derive from that one list — anything outside it is rejected with an input-validation error. The
advertised default comes from the package's `defaultCluster`, which prefers `mainnet-beta` and otherwise falls back to
the first entry.

The list is written out rather than aliased to the package's `SUPPORTED_CLUSTERS` so a newly supported cluster is opt-in
here instead of going live with a package bump. Adding or removing an entry is the whole change — `resolveRpcEndpoints`
resolves a URL for every supported cluster either way, and the handler refuses to start if an enabled cluster has none.

## Analytics

Optional, and off unless an API secret and a measurement id both resolve:

| Variable                | Purpose                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `MCP_GA_MEASUREMENT_ID` | GA4 Measurement ID for server-side usage events. Falls back to `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`; a dedicated id is preferred. |
| `MCP_GA_API_SECRET`     | GA4 Measurement Protocol API secret; pairs with `MCP_GA_MEASUREMENT_ID`.                                                       |

Events are sent after the response via Next's `after()`. The event names and the custom dimensions/metrics that must be
registered in the GA4 property are documented in
[`packages/entity-inspector/TELEMETRY.md`](../../packages/entity-inspector/TELEMETRY.md) — until they are registered,
GA4 collects the parameters but cannot report on them.

## Vercel

Add the variables in **Project Settings → Environment Variables**, then redeploy. `maxDuration = 60` applies to this
route only.

Per-IP abuse handling belongs in a Firewall rule on `/mcp`, not in this code: it sees real client IPs and applies
without a deploy, whereas `MCP_BLOCKED_IPS` is parsed at module scope and is only useful as a static backstop. Usage
analytics cannot stand in for it: GA4 receives a hashed `client_id`, so it can confirm an address you already suspect
but can never hand you one to block (see [`TELEMETRY.md`](../../packages/entity-inspector/TELEMETRY.md#client_id)).

### Preview deployments

Previews sit behind Deployment Protection, so clients must also present the
[Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
secret:

1. Generate it in **Project Settings → Deployment Protection → Protection Bypass for Automation**.
2. Send it as the `x-vercel-protection-bypass` header, or `?x-vercel-protection-bypass=<secret>` for clients that cannot
   set headers.

The bypass is on top of the endpoint's own `Bearer` auth.

## Smoke test

The `initialize` → `tools/call ping` round-trip is exercised by
`packages/entity-inspector/src/mcp/__tests__/handler.integration.spec.ts`; curl equivalents for a live deployment are
documented on its `negotiatedToolRequest` helper.

## Agent config

`.mcp.json` (Claude Code, Cursor, and compatible clients) — omit the bypass header outside previews:

```json
{
    "mcpServers": {
        "solana-explorer": {
            "type": "http",
            "url": "https://<deployment>/mcp",
            "headers": {
                "Authorization": "Bearer <key>",
                "x-vercel-protection-bypass": "<secret>"
            }
        }
    }
}
```

Or via the Claude Code CLI:

```sh
claude mcp add --transport http solana-explorer https://<deployment>/mcp \
  --header "Authorization: Bearer <key>" \
  --header "x-vercel-protection-bypass: <secret>"
```
