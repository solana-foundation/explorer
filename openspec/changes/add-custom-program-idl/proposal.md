# Proposal: Decode a program with a custom IDL

## Context

The Explorer decodes a program only with its on-chain IDL. A developer whose program has no on-chain IDL sees the program's instructions as raw bytes. [solana-foundation/explorer#573](https://github.com/solana-foundation/explorer/issues/573) requests an IDL that the user supplies.

## Why

- **The custom IDL stays in the browser.** This change rejects a URL parameter because a shared link can rename `transfer` to `claim_airdrop` on the Explorer's domain. This change rejects a server registry because a registry needs accounts and moderation.
- **The custom IDL is kept in IndexedDB, not in `localStorage`.** `localStorage` has one size limit for all keys of an origin. Some IDLs are large, so several large IDLs can exceed that limit. IndexedDB has a larger limit. A browser can read the whole `localStorage` on the first read of each page. Large values in `localStorage` add load time to every page.
- **One custom IDL applies on every cluster.** A developer deploys one program address to devnet and mainnet and expects one IDL for both. A devnet IDL can then decode mainnet data. The selector is highlighted while the custom IDL is selected, to show which IDL decodes the data.
- **A selected custom IDL is the only IDL that decodes the program.** With a fallback to the on-chain IDL, the developer cannot see that the custom IDL does not match the program.

## What Changes

- A program has at most one custom IDL.
- The user adds, replaces and removes a custom IDL on the IDL tab.
- A program with a custom IDL has a selector for the custom IDL and the on-chain IDLs.
- The IDL tab renders the selector.
- The IDL tab, instruction cards, account data and program log names use the same selection.

## Impact

- The IDL tab renders a selected custom IDL instead of the Program Metadata IDL.
- Server-rendered OG images decode with the on-chain IDL, because the custom IDL stays in the browser.
