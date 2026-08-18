# Proposal: Connect wallets through the Kit wallet plugin instead of Solana Wallet Adapter

## Why

Dependabot [#457](https://github.com/solana-foundation/explorer/security/dependabot/457) and [#458](https://github.com/solana-foundation/explorer/security/dependabot/458) report high-severity DoS parsers in `image-size` at runtime scope with `first_patched_version: null` — the advisory covers every published release. `pnpm why image-size` shows one runtime path: `@solana/wallet-adapter-react` → `@solana-mobile/wallet-adapter-mobile` → `react-native` → `metro` → `image-size`. Explorer is a web app pulling a React Native toolchain into production to satisfy wallet-adapter's mobile support. With no upstream patch, removing wallet-adapter is the only way to clear it.

`Phase 6.4` of the internal web3.js→kit plan sequences the wallet swap behind the Anchor rework (6.1) and kit-native transaction building (6.3). This change decouples it: wallet discovery, connection, and signing are what pull in wallet-adapter, so the existing web3.js build-and-send path stays and the change is confined to the wallet seam. Wallet state is mounted in exactly one place (`IdlSection.tsx`), so the blast radius is the interactive-IDL tab.

Alternatives considered:

- **Override `image-size`.** Rejected: no patched version exists.
- **Wait for 6.1/6.3.** Rejected: a multi-PR rewrite of Anchor-driven transaction building, with the advisories open throughout.
- **Migrate execution to Kit here too.** Rejected: it rewrites the error taxonomy `use-execute-transaction.ts` and its tests depend on (`SendTransactionError`, `pre_broadcast_failed` vs `broadcast_failed`) and duplicates 6.3's scope.
- **The Wallet Standard hooks inside `@solana/react`** (`useWalletAccountTransactionSigner` and friends). Rejected: upstream marks them superseded by the wallet-plugin hooks, so adopting them would mean migrating twice.

## What Changes

- **Dependencies.** `@solana/wallet-adapter-base`, `-base-ui`, `-react`, `-react-ui` out; `@solana/react` 7.0.0 and `@solana/kit-plugin-wallet` 0.14.0 in. `@solana/kit` stays at 7.0.0 — `@solana/react` 7.0.0 peers that exact version.
- **`wallet-provider.tsx`** builds a Kit client with `walletSigner({ autoConnect, chain, storageKey })` behind `ClientProvider`, replacing `ConnectionProvider` → `WalletProvider` → `WalletModalProvider`. Clients are cached per chain (each runs its own discovery and silent reconnect) and deliberately not disposed, since disposal would defeat the reconnect. Each chain gets its own `storageKey`.
- **`wallet/cluster-chain.ts`** maps a `Cluster` to a Wallet Standard chain identifier. Custom and SIMD-296 map to `solana:localnet`.
- **`wallet/disposable-stack-polyfill.ts`** installs `Symbol.dispose` and `DisposableStack` where absent. Kit registers plugin cleanup through both, and browsers only gained them in 2025; without the polyfill the IDL section throws on older browsers. Written in-repo rather than adding the `disposablestack` package.
- **`wallet/sign-web3js-transaction.ts`** bridges a Kit signer to web3.js transactions through the transaction wire format in both directions — the one representation the two libraries agree on, and the only one carrying legacy and versioned transactions alike. The signed result is rebuilt from the bytes the wallet returned.
- **`wallet/use-wallet.ts`** exposes the slice the interactive-IDL modules already consume, so their change is an import swap. It reports "no wallet" as `undefined` rather than `null`, so `isEnabled`, `createGetAutocompleteItems`, and `createWalletPrefillDependency` widen to match.
- **`WalletPickerDialog.tsx`** replaces `WalletModalProvider`'s modal; `ConnectWallet.tsx` drives it behind a `WalletReadyGate`; `InteractWithIdl.tsx` reads the analytics label from `walletName`. `BaseConnectWallet` is unchanged.
- **The `skipToast` prop is removed** from `WalletProvider`. The Kit plugin rejects the action promise instead of calling `onError`, and the only call site already passed `skipToast`, so no toast was reachable. Failures go to `Logger.error`.

## Impact

- **Security:** `image-size` leaves the runtime graph. It stays at dev scope through Storybook, which is build-time only.
- **Accepted risk (sign-and-send-only wallets).** A wallet exposing `solana:signAndSendTransaction` but not `solana:signTransaction` cannot execute instructions, since Explorer broadcasts through its own RPC and needs the signed transaction back. It now gets an explicit error. Phase 6.3 removes the constraint.
- **Accepted risk (custom clusters).** `solana:localnet` reaches the wallet's signature prompt and drives which network it simulates against, so a custom endpoint must not claim `solana:mainnet`. Cost: wallets not advertising localnet are not offered there. Mainnet, devnet, and testnet are unaffected.
- **Accepted risk (a wallet that rewrites the blockhash).** A modifying signer may swap in a blockhash of its own, while confirmation still watches the window Explorer requested before signing. If the wallet prompt outlives that window, a transaction that lands is reported as expired. The signature is surfaced either way, so the result is a misleading message rather than a lost transaction, and tracking the substituted window means polling validity by hand — Kit's `@solana/transaction-confirmation` does it properly, but only with an `RpcSubscriptions` client Explorer does not have yet. Phase 6.3 adopts it along with the rest of the transaction layer.
- **Accepted risk (watch-only wallets).** A connected wallet with no signer reads as not connected, so Execute stays disabled rather than failing at signing time. Such a wallet could not have executed under wallet-adapter either.
- **Tests.** `app/providers/__tests__/wallet-provider.spec.tsx` is removed — it asserted the `onError`/`skipToast` behaviour that no longer exists.
- **Deferred.** `use-wallet.ts` and `sign-web3js-transaction.ts` are written to be deleted by Phase 6.1/6.3, not extended.
