# instruction-card

## Purpose

One rendering layer for instruction cards, shared by `/tx/[signature]` and `/tx/(inspector)/inspector`. A card declares what an instruction means; the surface it renders on owns the chrome. Adding a field is one descriptor; adding a surface is one Context value.

**Scope.** These requirements bind every instruction card on both surfaces.

## ADDED Requirements

### Requirement: Surface-owned chrome

Instruction cards MUST NOT receive surface chrome as props. An `InstructionSurface` value in React Context SHALL contain the card frame (`Shell`) and the component that picks the card of a node (`Card`), plus the transaction's `SignatureResult`, its signature, and the data of its top-level instructions (`instructionData`).

The card body MUST draw the `Program` row in the decoded view, on both surfaces. The frame MUST draw its own `Program` row only in the raw view, where the body does not render. The frame therefore needs neither the width of the body nor the program name.

An address MUST render the same way on both surfaces, so `InstructionSurface` MUST NOT contain an address renderer.

The frame and the cards SHALL read the signature from `InstructionSurface`, and no other React Context SHALL carry it. `inspectorSurface` builds the inspector surface for one message. It sets `signature` to `undefined`, because the inspector reads its logs from a simulation, not from a fetched transaction. `useInstructionSurface` throws outside a provider instead of returning a default, matching `useInstructionParser`. A surface that omits `InstructionSurface.signature` MUST fail to compile, because a missing signature throws no error. The frame then fetches no raw transaction.

#### Scenario: One source for the signature

- **WHEN** the frame or a card needs the transaction signature
- **THEN** it MUST read `InstructionSurface.signature`
- **AND** in the inspector the frame MUST NOT request the raw transaction

#### Scenario: Same card on both surfaces

- **WHEN** the same instruction renders on the tx page and in the inspector
- **THEN** the card component MUST be the same component in both cases
- **AND** only the surface value MUST differ
- **AND** a token batch instruction is the exception: the tx page renders its RPC-parsed form with `RpcParsedTokenBatchCard`, and the inspector renders its bytes with `TokenBatchCard`

#### Scenario: Program row is drawn exactly once

- **WHEN** a card renders on either surface, in the decoded view or in the raw view
- **THEN** exactly one `Program` row MUST appear in the rendered card
- **AND** the body MUST draw it in the decoded view, and the frame MUST draw it in the raw view

#### Scenario: Program row shows the card's program name

- **WHEN** a card has a program name of its own
- **THEN** the body MUST render that name in the `Program` row of the decoded view, on both surfaces

#### Scenario: Card body wider than two columns

- **WHEN** a card body has more than two columns
- **THEN** the body MUST span its `Program` row to the right edge of the card body

#### Scenario: Missing provider

- **WHEN** a card renders outside an `InstructionSurfaceProvider`
- **THEN** `useInstructionSurface` MUST throw

### Requirement: Fields declared as data

A card SHALL declare its rows as data, not as table markup. Label and value rows are `InstructionField` descriptors. The argument rows of a decoded instruction are `InstructionArg` values. `ValueCell` MUST be the only component that formats a value. `AnchorInstructionBody` and the token batch `SubInstructionRow` are exceptions: they format their own values. Field rows and argument rows both render `ValueCell`, to give each kind one format. `InstructionFields` renders the field rows. `DecodedInstructionCard` renders the account and argument rows. `ProgramField` is the single sanctioned exception: it owns the markup of the leading `Program` row, because the inspector renders that row through its own validator.

The union is closed: `address`, `sol`, `bytes`, `string`, `text`, `timestamp`, `preformatted`, `custom`, `heading`. Every kind but `heading` pairs a label with a value; `heading` MUST name the rows that follow it and MUST span the row, so a card whose rows fall into repeated groups does not draw that divider itself. `text` MUST accept only `string | number`, and `custom` MUST be the sole markup door. A `string` value is text that the reader copies exactly, such as a seed or a string argument. `string` MUST render its value inside `Copyable`. `timestamp` MUST take unix seconds and own the UTC conversion; `preformatted` MUST draw its value in a `<pre>` and MUST take a list unjoined, so that no card spells out the layout itself. The `address` constructor MUST accept a web3.js `PublicKey` or a kit `Address`. The constructor MUST store a kit `Address`, to give every row one address type. A kit-native slice passes its `Address` without a conversion. `custom` MUST take a `ReactElement` rather than a `ReactNode`, so that a labelled row with nothing in it is not representable; a field with no value to show MUST be omitted from the list instead.

`InstructionFieldList` MUST admit `false` and `undefined` so optional rows read as `cond && address(...)`, and MUST NOT admit `null`, which `unicorn/no-null` forbids in card sources under `app/**` (the rule is off for tests and stories, and for a per-file legacy list that a card MUST NOT join).

#### Scenario: Field kind with no renderer

- **WHEN** a value kind has no `case` or no `CELL_CLASS` entry in `ValueCell`
- **THEN** the build MUST fail on an exhaustiveness check

#### Scenario: Repeated shape earns its own kind

- **WHEN** the same value rendering repeats across cards
- **THEN** it MUST be added as an `InstructionField` kind
- **AND** those cards MUST NOT each re-implement it through `custom`

#### Scenario: Kind that renders like an existing one

- **WHEN** a proposed kind would produce the same markup as a kind already in the union
- **THEN** it MUST NOT be added, and the existing kind MUST widen its value type instead
- **AND** a kind whose name describes a typeface rather than the value MUST NOT be added at all

#### Scenario: Card needing real markup

- **WHEN** a card's content does not fit the descriptor vocabulary
- **THEN** it MAY render `InstructionCardView` with its own children instead
- **AND** it MUST still take its chrome from the surface

#### Scenario: Card whose content depends on a hook

- **WHEN** a card needs a hook to produce a value or its title (async mint decimals, cluster-derived URLs, program events)
- **THEN** it MUST NOT use `defineInstructionCard`, whose `title` and `fields` are plain functions
- **AND** it MUST write its own component and render `InstructionCardView`
- **AND** it SHOULD still use `InstructionFields` for the rows it can express, with `custom()` for the rest

### Requirement: Decoded instruction card

A card that decodes its instruction with a Codama client SHALL render `DecodedInstructionCard`. `TokenBatchCard` is the exception, because one batch holds several sub-instructions. Every decoded card has the same account rows, role badges and argument table. The body has a Type column, so its `Program` row MUST span all `DECODED_TABLE_COLUMNS` columns.

A Codama decoder returns only the accounts that its IDL declares, so `DecodedInstructionCard` MUST read its accounts from the instruction. `DecodedInstructionCard` MUST label each account with the IDL account name at the same position.

#### Scenario: Instruction with more accounts than its IDL declares

- **WHEN** an instruction has more accounts than its IDL names
- **THEN** every account MUST have a row
- **AND** each account past the last IDL name MUST have the label `Remaining Account #n`, with `n` counting from 1

#### Scenario: Two accounts with one address

- **WHEN** two accounts of an instruction have the same address
- **THEN** each account MUST have its own row, with its own name and role badges

### Requirement: Single node prop

A card SHALL receive the instruction it renders as one `InstructionNode`, not as a spread of `ix`, `index`, `childIndex`, and `raw`. Nested cards MUST NOT travel through cards as props.

`InstructionNode.children` SHALL hold the CPIs of the instruction. The page builds the node tree from the transaction before it renders a card. `InstructionCardView` renders each child through `InstructionSurface.Card`, so no card renders another card. An `undefined` child marks a CPI that the page cannot resolve.

`InstructionNode.ix` is provisional: it exists for the frame, which branches on `'parsed' in ix` for the Raw view. Cards MUST NOT read `node.ix`, so the field can be reshaped when the instruction-parser compat wrap is deleted without touching any card.

`InstructionNode.programId` SHALL carry the program id separately from `ix`. It is stated as its own field rather than derived from `ix` at each call site precisely so that the `MUST NOT read node.ix` rule above stays absolute, and it is the first piece of the eventual `programId` + `raw` + optional-parsed-payload split already in place.

Program events are the deliberate exception to "nesting travels on the node". They are read from transaction logs *inside* the card and exist only on the tx page, so they MUST arrive as `InstructionCardView`'s `events` prop and MUST NOT be added to `InstructionNode`. A surface whose frame cannot render them SHALL drop them rather than fail.

#### Scenario: Program events reach the frame

- **WHEN** a card derives program events from transaction logs
- **THEN** it MUST pass them to `InstructionCardView` as `events`, not through the node
- **AND** on a surface with no logs the frame MUST render the card without them

#### Scenario: Program event logged by a CPI

- **WHEN** a CPI logs a program event
- **THEN** only the card of that CPI MAY render the event
- **AND** the card of its top-level instruction MUST NOT render it

#### Scenario: Card is unaware of nesting

- **WHEN** an instruction has inner instructions
- **THEN** the card MUST NOT declare or read any nested-card prop
- **AND** the nested cards MUST reach the frame through the view

#### Scenario: CPI that the page cannot resolve

- **WHEN** an instruction has a CPI that the page cannot resolve
- **THEN** the view MUST render an error card that names the position of the CPI
- **AND** the other CPIs MUST keep their positions

#### Scenario: Card reads only its decoded payload

- **WHEN** a card needs the instruction's raw bytes or its RPC-parsed payload
- **THEN** it MUST NOT read them from `node.ix`, and it MUST read the raw bytes from `node.raw`
- **AND** the values the card renders MUST come only from its decoded `info` and from `node.raw`
- **AND** the card MUST read only `node.programId` and `node.raw` from the node, plus `node.index` and `node.childIndex` when the card reads program events

### Requirement: One instruction router

Both surfaces SHALL pick the card of an instruction with `InstructionNodeCard`. The router dispatches the instruction through the instruction parser, then renders the first of: the PMP card, the card of a raw stake instruction, the card of the program label, the IDL card, and `UnknownDetailsCard`. A program whose card takes only decoded instructions hands an instruction that its parser slice rejects to the IDL card. The PMP card and the card of a raw stake instruction hand an instruction that they cannot decode to the IDL card in the same way. The router renders every card inside an ErrorBoundary whose fallback is `UnknownDetailsCard`.

#### Scenario: Curated card and a resolved IDL

- **WHEN** a program has a card of its own, the parser slice of the program decodes the instruction, and a fetched IDL also decodes it
- **THEN** both surfaces MUST render the card of the program
- **AND** MUST NOT replace the card when the IDL resolves after the first render

#### Scenario: Parser slice rejects the instruction

- **WHEN** the parser slice of a program cannot decode an instruction and the card of the program takes only decoded instructions
- **THEN** the router MUST render the IDL card when an IDL decodes the instruction
- **AND** MUST render `UnknownDetailsCard` otherwise

#### Scenario: Card throws

- **WHEN** a card throws while it renders, at the top level or as a CPI
- **THEN** the router MUST render `UnknownDetailsCard` in its place
- **AND** a PMP card that throws MUST render the IDL card instead when an IDL decodes the instruction
