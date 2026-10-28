# instruction-card

## ADDED Requirements

### Requirement: Card UI in the entity

Every component that draws part of an instruction card SHALL live in `app/entities/instruction-card/ui/`. The router and every card file MUST draw only components from `@entities/instruction-card`, React, `react-error-boundary` or another card file, and MUST NOT draw an intrinsic element such as `<div>` or `<tr>`. The entity MAY import generic components, such as `Address` and `BaseTable`, because pages that draw no card import them too.

#### Scenario: Content that no field kind draws

- **WHEN** a card needs to show content that no field kind of the entity draws
- **THEN** the entity MUST gain a field kind for that content
- **AND** the card MUST NOT draw the content itself

## MODIFIED Requirements

### Requirement: Surface-owned chrome

Instruction cards MUST NOT receive surface chrome as props. An `InstructionSurface` value in React Context SHALL contain the component that picks the card of a node (`Card`), the transaction's `SignatureResult`, its signature, the data of its top-level instructions (`instructionData`), the raw instructions that the page can fetch (`rawInstructions`), and the flags `collapsible` and `validateProgram`. The surface MUST NOT contain a component that draws the frame, so the two surfaces differ in behavior and not in markup.

The card body MUST draw the `Program` row in the decoded view, on both surfaces. The frame MUST draw its own `Program` row only in the raw view, where the body does not render. The frame therefore needs neither the width of the body nor the program name.

An address MUST render the same way on both surfaces, so `InstructionSurface` MUST NOT contain an address renderer.

Both surfaces SHALL draw the frame with `BaseInstructionCard`, through `InstructionCardView`. The inspector surface makes every card collapsible, and checks in the raw view that the program exists and is executable, because an inspected message has not run.

The frame SHALL receive the raw form of the instruction as one `RawSource` value, which `rawSourceOf` derives from the node and `rawInstructions`. A card that passes no children to `InstructionCardView` has no decoded view, so its frame opens on the raw view.

The frame and the cards SHALL read the signature from `InstructionSurface`, and no other React Context SHALL carry it. `inspectorSurface` builds the inspector surface for one message. It sets `signature` and `rawInstructions` to `undefined`, because the inspector reads its logs from a simulation, not from a fetched transaction. `useInstructionSurface` throws outside a provider instead of returning a default, matching `useInstructionParser`. A surface that omits `InstructionSurface.signature` or `InstructionSurface.rawInstructions` MUST fail to compile, because a missing value throws no error. The frame then fetches no raw transaction.

#### Scenario: One frame on both surfaces

- **WHEN** a card renders on the tx page or in the inspector
- **THEN** its frame MUST be `BaseInstructionCard`
- **AND** in the inspector the raw view MUST check the program of the instruction

#### Scenario: One source for the signature

- **WHEN** the frame or a card needs the transaction signature
- **THEN** it MUST read `InstructionSurface.signature`
- **AND** in the inspector the frame MUST NOT request the raw transaction

#### Scenario: Card with no decoded view

- **WHEN** a card renders `InstructionCardView` without children
- **THEN** the frame MUST open on the raw view
- **AND** the Raw toggle MUST be disabled

#### Scenario: Raw view of an RPC-parsed instruction

- **WHEN** the raw view of a top-level RPC-parsed instruction opens on the tx page before the page has fetched the raw transaction
- **THEN** the frame MUST request the raw transaction
- **AND** once the transaction arrives, the raw view MUST show the accounts and data of the instruction
- **AND** when web3.js cannot decompile the transaction, the raw view MUST say that the account list and hex data are not available

#### Scenario: Same card on both surfaces

- **WHEN** the same instruction renders on the tx page and in the inspector
- **THEN** the card component MUST be the same component in both cases
- **AND** only the surface value MUST differ
- **AND** a token batch instruction is the exception: the tx page renders its RPC-parsed form with `RpcParsedTokenBatchCard`, and the inspector renders its bytes with `TokenBatchCard`
- **AND** both batch cards MUST draw `BatchInstructionCard` with the same sub-instruction rows

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

A card SHALL declare its rows as data, not as table markup. Label and value rows are `InstructionField` descriptors. The argument rows of a decoded instruction are `InstructionArg` values. `ValueCell` MUST be the only component that formats a value, and `FieldBlock` MUST be the only component that draws a block. Field rows and argument rows both render `ValueCell`, to give each kind one format. `InstructionFields` renders the field rows. `InstructionFieldRows` renders them without the `Program` row, for a card that repeats groups of rows below one program. `DecodedInstructionCard` renders the account and argument rows. `ProgramField` is the single sanctioned exception: it owns the markup of the leading `Program` row, because the inspector renders that row through its own validator.

The union is closed: `address`, `account`, `sol`, `bytes`, `epoch`, `slot`, `string`, `text`, `timestamp`, `preformatted`, `json`, `heading`, and the blocks `note`, `rawData`, `documentText` and `payload`. Every kind but `heading` and the blocks pairs a label with a value; `heading` MUST name the rows that follow it and MUST span the row, so a card whose rows fall into repeated groups does not draw that divider itself. `account` MUST show the role badges of the account beside its label, as the account rows of `DecodedInstructionCard` do. `epoch` MUST link to the page of the epoch, and `slot` MUST link to the page of its block. `text` MUST accept only `string | number`. A kind MUST NOT accept markup, so a card cannot draw its own value. A `string` value is text that the reader copies exactly, such as a seed or a string argument. `string` MUST render its value inside `Copyable`. `timestamp` MUST take unix seconds and own the UTC conversion; `preformatted` MUST draw its value in a `<pre>` and MUST take a list unjoined, so that no card spells out the layout itself. The `address` constructor MUST accept a web3.js `PublicKey` or a kit `Address`. The constructor MUST store a kit `Address`, to give every row one address type. A kit-native slice passes its `Address` without a conversion. `address` with `tokenLabel` MUST show the token name of a mint in place of its address. `json` MUST show an object as a collapsible tree. A field with no value to show MUST be omitted from the list.

A block is content too wide for a value cell, so it MUST fill the row without a label column. `note` MUST draw a message about the instruction. `rawData` MUST draw bytes with hex and base64 views, a copy button and a download. `documentText` MUST draw the whole text of a decoded document with a copy button. `payload` MUST draw stored bytes on a Raw tab and what they decode to on a Decoded tab, MUST open on the Raw tab, and MUST report a tab that the reader opens, not the tab that opens first.

`InstructionFieldList` MUST admit `false` and `undefined` so optional rows read as `cond && address(...)`, and MUST NOT admit `null`, which `unicorn/no-null` forbids in card sources under `app/**` (the rule is off for tests and stories, and for a per-file legacy list that a card MUST NOT join).

#### Scenario: Field kind with no renderer

- **WHEN** a value kind has no `case` or no `CELL_CLASS` entry in `ValueCell`
- **THEN** the build MUST fail on an exhaustiveness check

#### Scenario: Repeated shape earns its own kind

- **WHEN** the same value rendering repeats across cards
- **THEN** it MUST be added as an `InstructionField` kind

#### Scenario: Kind that renders like an existing one

- **WHEN** a proposed kind would produce the same markup as a kind already in the union
- **THEN** it MUST NOT be added, and the existing kind MUST widen its value type instead
- **AND** a kind whose name describes a typeface rather than the value MUST NOT be added at all

#### Scenario: Content too wide for a value cell

- **WHEN** a card shows content that does not fit beside a label, such as a payload or a message
- **THEN** it MUST declare a block field
- **AND** the block MUST fill the row, across every column of the table

#### Scenario: Card whose content depends on a hook

- **WHEN** a card needs a hook to produce a value or its title (async mint decimals, cluster-derived URLs, program events)
- **THEN** it MUST NOT use `defineInstructionCard`, whose `title` and `fields` are plain functions
- **AND** it MUST write its own component and render `InstructionCardView`
- **AND** it MUST still declare its rows as fields

### Requirement: Decoded instruction card

A card that decodes its instruction with an IDL, through a Codama client or the Anchor coder, SHALL render `DecodedInstructionCard`. `TokenBatchCard` is the exception, because one batch holds several sub-instructions. Every decoded card has the same account rows, role badges and argument table. The body has a Type column, so its `Program` row MUST span all `DECODED_TABLE_COLUMNS` columns. A card adds rows below the arguments as `fields`, and each of those rows MUST span the same columns.

A Codama decoder returns only the accounts that its IDL declares, so `DecodedInstructionCard` MUST read its accounts from the instruction. `DecodedInstructionCard` MUST label each account with the IDL account name at the same position.

#### Scenario: Instruction with more accounts than its IDL declares

- **WHEN** an instruction has more accounts than its IDL names
- **THEN** every account MUST have a row
- **AND** each account past the last IDL name MUST have the label `Remaining Account #n`, with `n` counting from 1

#### Scenario: Two accounts with one address

- **WHEN** two accounts of an instruction have the same address
- **THEN** each account MUST have its own row, with its own name and role badges

#### Scenario: IDL that nests accounts in a group

- **WHEN** an IDL nests accounts in a group
- **THEN** the card MUST show a row for the group before its accounts
- **AND** the group MUST start collapsed, and MUST show its accounts only after the reader expands it

#### Scenario: Rows below the arguments

- **WHEN** a decoded card adds fields below its arguments
- **THEN** a value row MUST span its value across `DECODED_TABLE_COLUMNS` minus the label column
- **AND** a block MUST span all `DECODED_TABLE_COLUMNS` columns

### Requirement: Single node prop

A card SHALL receive the instruction it renders as one `InstructionNode`, not as a spread of `ix`, `index`, `childIndex`, and `raw`. Nested cards MUST NOT travel through cards as props.

The card of a program SHALL receive what the parser of the program decoded as `parsed`, the `{ type, info }` payload, and MUST NOT receive the `ParsedInstruction` that carries it. The router takes `parsed` from the dispatch result. A card that shows its own Unknown title receives `undefined` when the parser cannot decode the instruction.

`InstructionNode.children` SHALL hold the CPIs of the instruction. The page builds the node tree from the transaction before it renders a card. The frame renders each child through `InstructionSurface.Card`, so no card renders another card. An `undefined` child marks a CPI that the page cannot resolve.

`InstructionNode.ix` is provisional: it exists for the frame, which branches on `'parsed' in ix` for the Raw view. Cards MUST NOT read `node.ix`, so the field can be reshaped when the instruction-parser compat wrap is deleted without touching any card.

`InstructionNode.programId` SHALL carry the program id separately from `ix`. It is stated as its own field rather than derived from `ix` at each call site precisely so that the `MUST NOT read node.ix` rule above stays absolute, and it is the first piece of the eventual `programId` + `raw` + optional-parsed-payload split already in place.

Program events are the deliberate exception to "nesting travels on the node". They are read from transaction logs _inside_ the card and exist only on the tx page, so they MUST arrive as `InstructionCardView`'s `events` prop and MUST NOT be added to `InstructionNode`. A surface whose frame cannot render them SHALL drop them rather than fail. The frame draws each event as rows of the card, and in the raw view it MUST show the bytes of each event.

#### Scenario: Program events reach the frame

- **WHEN** a card derives program events from transaction logs
- **THEN** it MUST pass them to `InstructionCardView` as `events`, not through the node
- **AND** on a surface with no logs the frame MUST render the card without them

#### Scenario: Program event in the raw view

- **WHEN** a card with program events opens its raw view
- **THEN** each event MUST show its bytes instead of its fields

#### Scenario: Program event logged by a CPI

- **WHEN** a CPI logs a program event
- **THEN** only the card of that CPI MAY render the event
- **AND** the card of its top-level instruction MUST NOT render it

#### Scenario: Card is unaware of nesting

- **WHEN** an instruction has inner instructions
- **THEN** the card MUST NOT declare or read any nested-card prop
- **AND** the frame MUST draw the nested cards from the node

#### Scenario: CPI that the page cannot resolve

- **WHEN** an instruction has a CPI that the page cannot resolve
- **THEN** the view MUST draw `InstructionCardFrame` with the position of the CPI, and a note that names the position
- **AND** the card MUST NOT offer a Raw view, because there is no instruction to show
- **AND** the other CPIs MUST keep their positions

#### Scenario: Card reads only its decoded payload

- **WHEN** a card needs the instruction's raw bytes or its RPC-parsed payload
- **THEN** it MUST NOT read them from `node.ix`, and it MUST read the raw bytes from `node.raw`
- **AND** the values the card renders MUST come only from `parsed` and from `node.raw`
- **AND** the card MUST read only `node.programId` and `node.raw` from the node, plus `node.index` and `node.childIndex` when the card reads program events

#### Scenario: Card receives the decoded payload once

- **WHEN** the router renders the card of a program
- **THEN** it MUST pass the decoded payload as `parsed`
- **AND** it MUST NOT pass the dispatch result or the `ParsedInstruction` beside the node

#### Scenario: Card reads the raw instruction

- **WHEN** a card reads the account list or the data bytes of the instruction, not its decoded `info`
- **THEN** it MUST read them from `node.raw`
- **AND** it MUST NOT take a `TransactionInstruction` prop beside `node`
- **AND** the caller MUST build the node with `toRawInstructionNode`, which takes `programId` and `raw` from one instruction

### Requirement: One instruction router

Both surfaces SHALL pick the card of an instruction with `InstructionNodeCard`. The router dispatches the instruction through the instruction parser, then renders the first of: the PMP card, the card of a raw stake instruction, the card of the program label, the IDL card, and `UnknownDetailsCard`. A program whose card takes only decoded instructions hands an instruction that its parser slice rejects to the IDL card. The PMP card and the card of a raw stake instruction hand an instruction that they cannot decode to the IDL card in the same way. The router renders every card inside an ErrorBoundary whose fallback is `UnknownDetailsCard`. The router loads the code of the PMP card on demand, and MUST draw `LoadingDetailsCard` for the node while that code loads.

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

#### Scenario: PMP card code still loading

- **WHEN** a PMP instruction renders before the code of the PMP card has loaded
- **THEN** the router MUST draw the frame of the node with `LoadingDetailsCard`
- **AND** MUST replace it with the PMP card once the code loads
