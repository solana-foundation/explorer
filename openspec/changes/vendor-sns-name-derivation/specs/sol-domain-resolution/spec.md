## ADDED Requirements

### Requirement: SNS name derivation SHALL be implemented in-repo against kit codecs

The system SHALL derive `.sol` name account addresses without depending on `@bonfida/spl-name-service`. Name hashing SHALL be SHA-256 over the UTF-8 bytes of `"SPL Name Service"` concatenated with the bare label, and the name account SHALL be the program-derived address of `namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX` over exactly three seeds in order — the 32-byte hashed name, the name class, and the name parent — where an absent class or parent is seeded as 32 zero bytes.

#### Scenario: Deriving a `.sol` name account

- **WHEN** a bare label is hashed and derived with the `.sol` TLD authority `58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx` as the name parent and no name class
- **THEN** the resulting address SHALL equal the address `@bonfida/spl-name-service` 0.1.30 produced for the same label

#### Scenario: Hashing is case sensitive

- **WHEN** two labels differ only in letter case
- **THEN** their hashed names SHALL differ, and the caller SHALL normalize case before hashing

### Requirement: Registry decoding SHALL read the owner from the fixed 96-byte header

The system SHALL decode a name registry account as three consecutive 32-byte addresses — `parentName`, `owner`, `class` — and SHALL ignore any free-form account data following that 96-byte header.

#### Scenario: Account carrying trailing data

- **WHEN** a registry account is longer than 96 bytes
- **THEN** the owner SHALL be read from bytes 32..64 and the trailing bytes SHALL be ignored

#### Scenario: Account too short to hold a header

- **WHEN** a registry account is shorter than 96 bytes
- **THEN** decoding SHALL report no owner and `resolveDomain` SHALL return `null` rather than propagating a deserialization error
