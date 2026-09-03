## Development

### Creating new UI components

For new components we use [shadcn/ui](https://ui.shadcn.com/docs).

To generate a component, use this script:

```bash
pnpm gen accordion
```

It translates needed component into `pnpx shadcn@version add accordion` and installs it.

### Testing on mobile devices

To test on a remote mobile device (e.g., Safari on iPhone), run the dev server with HTTPS:

```bash
pnpm dev --experimental-https
```

This is required because Safari requires HTTPS for Web Cryptography API (`crypto.subtle`) access, which Solana dependencies need.

### Generating sitemap

To generate sitemaps from the build route information:

```bash
pnpm build:info
pnpx tsx scripts/update-sitemap.ts
```

This generates:

- `public/sitemap.xml` - sitemap index
- `public/default-sitemap.xml` - static pages
- `public/accounts-sitemap.xml` - known program addresses

### Firewall

Production challenges every client it cannot identify as a browser, so any route built for crawlers or agents is
unreachable until it has a `Bypass` rule. Rules live in the Vercel dashboard, not the repo — configure them when the
route ships, not when something breaks.

- [`firewall.md`](./firewall.md) — pipeline stages, rule semantics, incident runbook, permissions, and the icon rules
- [`app/og/README.md`](../app/og/README.md) — OG images and receipt pages, plus receipt env keys
- [`app/mcp/README.md`](../app/mcp/README.md) — `/mcp`
