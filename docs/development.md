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