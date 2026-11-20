# instruction-parser

## ADDED Requirements

### Requirement: Slice output names its parser

The dispatcher MUST set `parser` on every result that a slice produced, to the `InstructionParser` that produced it. It MUST NOT set `parser` on an RPC object that it passes through.

#### Scenario: Byte path tags slice output

- **WHEN** `fromTransactionInstruction(ix)` decodes `ix` with a registered parser
- **THEN** the result MUST carry that parser as `parser`

#### Scenario: RPC path tags slice output

- **WHEN** `fromParsedInstruction(ix)` finds a slice whose `fromParsed` accepts `ix`
- **THEN** the result MUST carry that parser as `parser`

#### Scenario: Pass-through carries no parser

- **WHEN** `fromParsedInstruction(ix)` finds no slice, or the slice's `fromParsed` returns `undefined`
- **THEN** the dispatcher MUST return `ix` reference-equal
- **AND** `isParsedBy` MUST return `false` for it

### Requirement: Routed cards take the slice type

A card that the router reaches through `parsedBy` MUST receive only output that `isParsedBy` accepts for its slice's parsers, and it MUST NOT validate `parsed` again.

#### Scenario: Slice rejects an RPC payload

- **WHEN** the System slice rejects an RPC payload
- **THEN** the router MUST render the Unknown card
- **AND** the System card MUST NOT render
- **AND** the router MUST report the payload to Sentry
