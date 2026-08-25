# Proposal: Connect wallets through the Kit wallet plugin instead of Solana Wallet Adapter

## Context

Dependabot [#457](https://github.com/solana-foundation/explorer/security/dependabot/457) and [#458](https://github.com/solana-foundation/explorer/security/dependabot/458) report high-severity DoS parsers in `image-size` at runtime scope, unpatched in every published release. `pnpm why image-size` shows one runtime path: `@solana/wallet-adapter-react` → `@solana-mobile/wallet-adapter-mobile` → `react-native` → `metro` → `image-size`. A web app is carrying a React Native toolchain into production to satisfy wallet-adapter's mobile support.

## Why

Removing wallet-adapter is the only way to clear the advisories: there is no patched `image-size`, and `Phase 6.4` of the internal web3.js→kit plan sequences the wallet swap behind kit-native transaction building, which is a multi-PR rewrite. Only the _connection_ layer depends on wallet-adapter, so this replaces discovery, connection, and signing while transaction building and broadcasting stay on web3.js. Wallet state is mounted in one place (`IdlSection.tsx`), so the blast radius is the interactive-IDL tab.

Alternatives: overriding `image-size` (no patched version exists); waiting for the transaction-layer work (advisories stay open for its duration); migrating execution to Kit here too (rewrites the error taxonomy `use-execute-transaction.ts` and its tests depend on); the Wallet Standard hooks in `@solana/react` (upstream marks them superseded by the wallet-plugin hooks, so we would migrate twice).

## What Changes

- **Dependencies.** `@solana/wallet-adapter-{base,base-ui,react,react-ui}` out; `@solana/react` 7.0.0 and `@solana/kit-plugin-wallet` 0.14.0 in. `@solana/kit` stays at 7.0.0, which `@solana/react` 7.0.0 peers exactly.
- **`wallet-provider.tsx`** publishes a `walletSigner({ autoConnect, chain, storageKey })` client through `ClientProvider`. Clients are cached by chain alone and deliberately not disposed — each runs its own discovery and silent reconnect, which disposal would defeat — and each chain gets its own `storageKey` so a wallet connected on one cluster does not read as connected on another. `autoConnect` is fixed rather than a prop: as a second key dimension it would let two clients share one persisted selection.
- **`wallet/cluster-chain.ts`** maps a `Cluster` to a Wallet Standard chain identifier. Custom and SIMD-296 map to `solana:localnet`.
- **`wallet/disposable-stack-polyfill.ts`** installs `Symbol.dispose` and `DisposableStack` where absent; Kit registers plugin cleanup through both, which browsers only gained in 2025. In-repo rather than the `disposablestack` package.
- **`wallet/sign-web3js-transaction.ts`** bridges a Kit signer to web3.js through the transaction wire format — the one representation both libraries agree on, and the only one carrying legacy and versioned transactions alike — rebuilding the result from the bytes the wallet returned.
- **`wallet/use-wallet.ts`** exposes the slice the interactive-IDL modules already consume, so their change is an import swap. "No wallet" is `undefined` rather than `null`, so `isEnabled`, `createGetAutocompleteItems`, and `createWalletPrefillDependency` widen to match. `connected` reports connection status and a separate `canSign` reports whether a signer is present, so a wallet that connected without one can still be disconnected.
- **UI.** `WalletPickerDialog.tsx` replaces `WalletModalProvider`'s modal, `ConnectWallet.tsx` drives it behind a `WalletReadyGate`, and `InteractWithIdl.tsx` reads its analytics label from `walletName`. `BaseConnectWallet` is unchanged.
- **`skipToast` is removed** from `WalletProvider`: the Kit plugin rejects the action promise instead of calling `onError`, and the only call site already passed `skipToast`, so no toast was reachable. Failures go to `Logger.error`.

## Impact

- `image-size` leaves the runtime graph, remaining at dev scope through Storybook. `app/providers/__tests__/wallet-provider.spec.tsx` is deleted with the `onError`/`skipToast` behaviour it asserted.
- **Accepted risk (sign-and-send-only wallets).** A wallet exposing `solana:signAndSendTransaction` but not `solana:signTransaction` cannot execute instructions, since Explorer broadcasts through its own RPC and needs the signed transaction back. It gets an explicit error; `6.3` removes the constraint by letting the wallet send.
- **Accepted risk (custom clusters).** The chain identifier reaches the wallet's signature prompt and drives which network it simulates against, so a custom endpoint must not claim `solana:mainnet`. Cost: wallets not advertising `solana:localnet` are not offered there.
- **Accepted risk (watch-only wallets).** A connected wallet with no signer reports `canSign: false`, so Execute stays disabled rather than failing at signing time. Neither could it have executed under wallet-adapter.
- **Accepted risk (a wallet that rewrites the blockhash).** A modifying signer may substitute its own blockhash while confirmation still watches the window read before signing, so a prompt outliving that window reports a landed transaction as expired. The signature is surfaced either way, making this a misleading message rather than a lost transaction. Tracking the substituted window means hand-rolling a validity poll; `@solana/transaction-confirmation` does it properly but needs an `RpcSubscriptions` client Explorer does not have yet, so `6.3` adopts it with the rest of the transaction layer.
- **Deferred.** `use-wallet.ts` and `sign-web3js-transaction.ts` are written to be deleted by that work, not extended.
