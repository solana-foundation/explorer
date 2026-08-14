# Transaction inspector

## ADDED Requirements

### Requirement: v1 transactions SHALL render in the inspector through every entry path

A v1 message SHALL be accepted by the permalink fetch, the `?message=` URL parameter, and the pasted-input path. Detection SHALL use the wire version prefix byte, so legacy and v0 inputs continue through the web3.js decode path unchanged.

#### Scenario: v1 permalink

- **WHEN** a fetched transaction decodes as v1
- **THEN** the inspector SHALL render the overview, accounts, signatures, and instructions cards from the bridged message

#### Scenario: v1 pasted or linked message

- **WHEN** a pasted or URL-supplied message carries the v1 wire prefix
- **THEN** the inspector SHALL render it rather than reporting a decode error

#### Scenario: undecodable v1 bytes

- **WHEN** bytes carrying the v1 prefix fail to decode as a v1 message
- **THEN** the inspector SHALL show the unsupported-transaction error card

### Requirement: Operations on a bridged v1 message SHALL use the original wire bytes

`serialize()` on the bridged view SHALL return the v1 wire bytes it was decoded from, so simulation, signature verification, size reporting, downloads, and cache fingerprints operate on the bytes the network sees, never a v0 re-encoding.

#### Scenario: simulating a v1 transaction

- **WHEN** the simulator wraps the bridged message in a `VersionedTransaction`
- **THEN** the serialized wire transaction SHALL contain the original v1 message bytes byte-for-byte

### Requirement: v1 resource limits SHALL render in the overview card

The overview card SHALL render a v1 version row and each resource limit the message sets — compute unit limit, total priority fee, loaded accounts data size limit, heap size — with the priority fee labelled as a total, matching the detail page's presentation.

#### Scenario: v1 message with limits

- **WHEN** a v1 message sets any resource limits
- **THEN** the overview card SHALL render a row per limit that is present

### Requirement: The address table lookups card SHALL NOT render for v1

A v1 message carries static accounts only, so the inspector SHALL omit the lookups card rather than render an empty table.

#### Scenario: v1 message

- **WHEN** the inspected transaction is v1
- **THEN** no address table lookups card SHALL appear
