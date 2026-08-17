# Tasks

## 1. Dependencies

- [x] Drop `@solana/wallet-adapter-base`, `-base-ui`, `-react`, `-react-ui` from `package.json`.
- [x] Add `@solana/react` 7.0.0 and `@solana/kit-plugin-wallet` 0.14.0. `@solana/kit` stays at 7.0.0 (`@solana/react` 7.0.0 peers that exact version, and 7.1.0 is younger than the workspace `minimumReleaseAge`).

## 2. Wallet provider

- [x] `app/providers/wallet-provider.tsx` — build the client with `walletSigner({ autoConnect, chain, storageKey })`, publish via `ClientProvider`, cache per chain (bounded, deliberately not disposed), give each chain its own storage key, export `useWalletClient`.
- [x] `app/providers/wallet/cluster-chain.ts` — `Cluster` → Wallet Standard chain identifier; Custom/SIMD-296 map to `solana:localnet`, since the identifier reaches the wallet's signature prompt and drives which network it simulates against.
- [x] Drop the `@solana/wallet-adapter-react-ui/styles.css` import and the `skipToast` prop; update the `IdlSection.tsx` call site.

## 3. Signing bridge

- [x] `app/providers/wallet/sign-web3js-transaction.ts` — convert through the transaction wire format in both directions, sign through the Kit modifying signer, and rebuild from the wallet's returned bytes. Carries legacy and versioned transactions, since Anchor's wallet interface is generic over both. Reject sign-and-send-only wallets with an explicit error.
- [x] `app/providers/wallet/use-wallet.ts` — expose the slice the interactive-IDL modules consume so their change is an import swap.

## 4. Connect UI

- [x] `app/providers/wallet/WalletPickerDialog.tsx` — replaces `WalletModalProvider`, listing `useWallets` results.
- [x] `ConnectWallet.tsx` — drive the picker directly behind a `WalletReadyGate`; drop `useWalletMultiButton` / `useWalletModal`.
- [x] `use-wallet.ts` — count `pending` as connecting, and report a watch-only wallet (connected, no signer) as not connected.
- [x] `use-logged-wallet-error.ts` — connect/disconnect use `dispatch` and log from the action hook's `error`, so a superseded double-click is not reported as a failure.
- [x] `InteractWithIdl.tsx` — analytics label from `walletName` instead of `wallet.adapter.name`.

## 5. Tests

- [x] Remove `app/providers/__tests__/wallet-provider.spec.tsx` (asserted the removed `onError`/`skipToast` behaviour).
- [x] Add specs for the signing bridge (legacy and versioned round trips, the sign-and-send-only rejection, the empty-batch short circuit) and the cluster-to-chain mapping.
- [x] Retarget the two interactive-IDL specs' mocks onto the compat hook.

## 6. Follow-on type widening

- [x] `isEnabled`, `createGetAutocompleteItems`, and `createWalletPrefillDependency` take `PublicKey | undefined` instead of `PublicKey | null`. The Kit-backed hook reports "no wallet" as `undefined`, matching the repo's `unicorn/no-null` direction; `ExternalDependency.getValue` already allowed it.

## 7. Verify

- [x] `pnpm why image-size` shows no runtime path; the wallet-adapter chain is gone from the lockfile.
- [x] `pnpm format:ci`, `pnpm lint`, `pnpm openspec:validate`, `pnpm build`, `pnpm test:ci`.
- [ ] Manual pass on a program page: connect, reload/auto-reconnect, disconnect, cluster switch, execute an instruction on devnet, reject a prompt, simulate while disconnected.
