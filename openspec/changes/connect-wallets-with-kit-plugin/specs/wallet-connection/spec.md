## ADDED Requirements

### Requirement: Wallets SHALL be discovered through Wallet Standard, not per-wallet adapters

Explorer SHALL discover connectable wallets through the Wallet Standard registry exposed by `@solana/kit-plugin-wallet`, and SHALL NOT depend on `@solana/wallet-adapter-*`. The mobile wallet adapter chain those packages pull in carries a React Native toolchain into the runtime dependency graph, which is how the unpatched `image-size` advisories reach production.

#### Scenario: A user opens the connect dialog with wallets installed

- **WHEN** one or more Wallet Standard wallets are registered for the client's chain
- **THEN** the picker SHALL list each discovered wallet by name and icon
- **AND** selecting one SHALL connect through the wallet plugin

#### Scenario: A user opens the connect dialog with no wallet installed

- **WHEN** no Wallet Standard wallet is registered for the client's chain
- **THEN** the picker SHALL say so rather than render an empty list

### Requirement: The chain identifier SHALL describe the network the user is actually on

Mainnet, devnet, and testnet SHALL map to their Wallet Standard chain identifiers. Custom and SIMD-296 clusters point at arbitrary endpoints and SHALL map to `solana:localnet`. The identifier is not only a discovery filter — it is sent with every signature request, and wallets use it to decide which network to simulate the transaction against — so a custom endpoint SHALL NOT be labelled `solana:mainnet`. The accepted cost is narrower discovery on those clusters.

#### Scenario: A user selects a custom RPC endpoint

- **WHEN** the active cluster is Custom or SIMD-296
- **THEN** the wallet client SHALL be configured with the `solana:localnet` identifier
- **AND** a wallet that does not advertise that chain SHALL NOT be offered in the picker
- **AND** transactions SHALL still be broadcast through the selected cluster's RPC connection

### Requirement: Wallet UI SHALL be held back until discovery settles

Wallet Standard registration is asynchronous, and a persisted wallet is reconnected silently on load. Connect UI SHALL NOT be presented as actionable while the client is still in its `pending` or `reconnecting` warm-up, because a picker opened in that window reports no wallets installed when wallets are in fact present.

#### Scenario: A returning user loads a program page

- **WHEN** the wallet client has not finished its initial warm-up
- **THEN** the connect control SHALL render in a disabled, connecting state
- **AND** SHALL reveal its connected or disconnected state only once the warm-up has settled

### Requirement: Each cluster SHALL persist its wallet selection separately

A wallet client is created per chain, and each SHALL persist its selected account under its own storage key. Sharing one key would let a wallet connected on one cluster appear connected on another, and let a disconnect on either clear both.

#### Scenario: A user connects on one cluster and switches to another

- **WHEN** a wallet is connected on mainnet and the user switches to devnet
- **THEN** the devnet client SHALL reflect only what was connected on devnet
- **AND** disconnecting on devnet SHALL leave the mainnet connection intact

### Requirement: Wallet signatures SHALL be obtained from the bytes the wallet returns

Interactive-IDL transactions are built with web3.js and broadcast through Explorer's own RPC connection, while the connected wallet is a Kit signer. The bridge between them SHALL hand the wallet the compiled message together with a signature slot per required signer, and SHALL rebuild the transaction from the bytes the wallet returned. A wallet exposing `solana:signTransaction` surfaces as a modifying signer and is free to alter the message it was given, so copying a signature back onto the original transaction would broadcast a message the signature does not cover.

#### Scenario: A wallet returns a modified message

- **WHEN** the wallet returns a signed transaction whose message differs from the one it was handed
- **THEN** the transaction that is broadcast SHALL be the one the wallet returned
- **AND** its signatures SHALL verify against it

#### Scenario: A wallet can only sign and send

- **WHEN** the connected wallet exposes `solana:signAndSendTransaction` but not `solana:signTransaction`
- **THEN** execution SHALL fail with an error naming that limitation
- **AND** SHALL NOT broadcast an unsigned or partially signed transaction

#### Scenario: A watch-only wallet connects

- **WHEN** the connected wallet exposes no signing feature at all
- **THEN** the feature SHALL treat it as not connected
- **AND** SHALL keep Execute disabled rather than enabling it and failing at signing time
