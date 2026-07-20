# `/mcp` endpoint

MCP server serving the `@explorer/entity-inspector` tools over the [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http). Stateless — a fresh server per request — so it is serverless-safe. Lives at `/mcp` (not `/api/*`) to escape the BotID proxy matcher.

## Enabling

Inert by default (`503`). Env-only configuration (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `MCP_ENDPOINT_ENABLED` | `true` enables the endpoint. |
| `MCP_ACCESS_KEYS` | Comma-separated bearer keys; requests need `Authorization: Bearer <key>`. Unset = open access (startup warning). |
| `MCP_BLOCKED_IPS` | Comma-separated client IPs rejected with 403. |
| `MCP_SOLANA_RPC_URL_MAINNET_BETA` / `_DEVNET` / `_TESTNET` / `_SIMD296` | Dedicated RPC endpoints keeping MCP traffic off the app's quota; public endpoints are the fallback. |

Keys and blocklist are parsed at module scope — changes require a redeploy.

## Vercel

Add the variables in **Project Settings → Environment Variables**, then redeploy. `maxDuration = 60` applies to this route only.

### Preview deployments

Previews sit behind Deployment Protection, so clients must also present the [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) secret:

1. Generate it in **Project Settings → Deployment Protection → Protection Bypass for Automation**.
2. Send it as the `x-vercel-protection-bypass` header, or `?x-vercel-protection-bypass=<secret>` for clients that cannot set headers.

The bypass is on top of the endpoint's own `Bearer` auth.

## Smoke test

The `initialize` → `tools/call ping` round-trip is exercised by `packages/entity-inspector/src/mcp/__tests__/handler.integration.spec.ts`; curl equivalents for a live deployment are documented on its `negotiatedToolRequest` helper.

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
