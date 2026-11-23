## ADDED Requirements

### Requirement: Wallets SHALL be discovered through Wallet Standard, not per-wallet adapters

Explorer SHALL discover connectable wallets through the Wallet Standard registry exposed by `@solana/kit-plugin-wallet`, and SHALL NOT depend on `@solana/wallet-adapter-*`.

#### Scenario: A user opens the connect dialog with wallets installed

- **WHEN** one or more Wallet Standard wallets are registered for the client's chain
- **THEN** the picker SHALL list each discovered wallet by name and icon
- **AND** selecting one SHALL connect through the wallet plugin

#### Scenario: A user opens the connect dialog with no wallet installed

- **WHEN** no Wallet Standard wallet is registered for the client's chain
- **THEN** the picker SHALL say so rather than render an empty list

### Requirement: The chain identifier SHALL describe the network the user is actually on

Mainnet, devnet, and testnet SHALL map to their Wallet Standard chain identifiers, and Custom and SIMD-296 clusters SHALL map to `solana:localnet`. The identifier is sent with every signature request and decides which network a wallet simulates against, so an arbitrary endpoint must not be labelled `solana:mainnet`.

#### Scenario: A user selects a custom RPC endpoint

- **WHEN** the active cluster is Custom or SIMD-296
- **THEN** the wallet client SHALL be configured with the `solana:localnet` identifier
- **AND** a wallet that does not advertise that chain SHALL NOT be offered in the picker
- **AND** transactions SHALL still be broadcast through the selected cluster's RPC connection

### Requirement: Wallet UI SHALL be held back until discovery settles

Connect UI SHALL NOT be presented as actionable while the client is still in its `pending` or `reconnecting` warm-up. Wallet Standard registration is asynchronous, so a picker opened in that window reports no wallets installed when wallets are in fact present.

#### Scenario: A returning user loads a program page

- **WHEN** the wallet client has not finished its initial warm-up
- **THEN** the connect control SHALL render in a disabled, connecting state
- **AND** SHALL reveal its connected or disconnected state only once the warm-up has settled

### Requirement: Each cluster SHALL persist its wallet selection separately

A wallet client is created per chain, and each SHALL persist its selected account under its own storage key.

#### Scenario: A user connects on one cluster and switches to another

- **WHEN** a wallet is connected on mainnet and the user switches to devnet
- **THEN** the devnet client SHALL reflect only what was connected on devnet
- **AND** disconnecting on devnet SHALL leave the mainnet connection intact

### Requirement: Wallet signatures SHALL be obtained from the bytes the wallet returns

The bridge between Explorer's web3.js transactions and the Kit signer SHALL hand the wallet the compiled message with a signature slot per required signer, and SHALL rebuild the transaction from the bytes the wallet returned. A wallet exposing `solana:signTransaction` surfaces as a modifying signer and may alter the message, so a signature copied back onto the original would not cover what gets broadcast.

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
- **THEN** the feature SHALL report it as connected but unable to sign
- **AND** SHALL keep Execute disabled rather than enabling it and failing at signing time
- **AND** SHALL still allow the user to disconnect it
