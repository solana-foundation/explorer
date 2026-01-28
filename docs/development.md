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

### Transaction Receipt Feature

The receipt feature generates shareable OG images for transactions at `/og/receipt/[signature]`.

**Vercel Firewall Configuration Required:** If Attack Challenge Mode is enabled, add a bypass rule for `/og/` path in Vercel Dashboard -> Firewall -> Add New... -> Rule, otherwise social media crawlers won't be able to fetch preview images.

Name: Allow bots for OG images
Description: Allow social media crawlers to fetch OG image previews
Rule:
```
If `Request Path` `Starts with` `/og/receipt/`
    Then `Bypass`
```

Name: Allow bots to visit receipt pages
Description: Allow social media crawlers to visit receipt pages
Rule:
```
If `Request Path` `Starts with` `/tx/`
    AND `Query` `view` `Equals` `receipt`
    Then `Bypass`
```

⚠️ Important note: `Log` mode does not allow the preview to work. `Bypass` is needed
