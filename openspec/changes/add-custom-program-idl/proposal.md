# Proposal: Decode a program with a custom IDL

## Context

The Explorer decodes a program only with its on-chain IDL. A developer whose program has no on-chain IDL sees the program's instructions as raw bytes. [solana-foundation/explorer#573](https://github.com/solana-foundation/explorer/issues/573) requests an IDL that the user supplies.

## Why

- **The custom IDL stays in the browser.** This change rejects a URL parameter because a shared link can rename `transfer` to `claim_airdrop` on the Explorer's domain. This change rejects a server registry because a registry needs accounts and moderation.
- **The custom IDL is kept in IndexedDB, not in `localStorage`.** `localStorage` has one size limit for all keys of an origin. Some IDLs are large, so several large IDLs can exceed that limit. IndexedDB has a larger limit. A browser can read the whole `localStorage` on the first read of each page. Large values in `localStorage` add load time to every page.
- **One custom IDL applies on every cluster.** A developer deploys one program address to devnet and mainnet and expects one IDL for both. A devnet IDL can then decode mainnet data. The selector is highlighted while the custom IDL is selected, to show which IDL decodes the data.
- **A selected custom IDL is the only IDL that decodes the program.** With a fallback to the on-chain IDL, the developer cannot see that the custom IDL does not match the program.
- **A selected custom IDL takes precedence over the Explorer decoder.** The user expects the selected IDL to apply.
- **A consumer must not render an IDL decode before the store reads the stored selection.** IndexedDB has no synchronous read, so the first render has no selection. Without a selection, a consumer decodes with the on-chain IDL.

## What Changes

- A program has at most one custom IDL.
- The Explorer rejects a custom IDL that declares another program or that the decoder cannot load.
- The user adds, replaces and removes a custom IDL on the IDL tab or in the Custom IDLs catalog.
- A program with a custom IDL has a selector for the custom IDL and the on-chain IDLs.
- The IDL tab, instruction cards with raw bytes and the generic Overview card of a data account render the selector.
- The IDL tab, the program header name, instruction cards, account data, program log names and the instruction names in transaction history, CU profiling and simulation use the same selection.
- The Program Multisig card and the verified-build check keep the on-chain IDL. They report on the authority and the build of another program, so a custom IDL for Squads or for the verify program does not change them.

## Impact

- The IDL tab renders a selected custom IDL instead of the Program Metadata IDL.
- Server-rendered OG images decode with the on-chain IDL, because the custom IDL stays in the browser.
- When the Explorer cannot read the stored selection, it decodes with the on-chain IDLs and shows no selector. The browser can block IndexedDB, the decoder check can fail to load, or a stored record can fail to parse.
