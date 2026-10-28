# Proposal: Keep instruction card UI in the entity

## Context

- `unify-instruction-card-rendering` gave every instruction card one frame, `InstructionCardView`, drawn by `BaseInstructionCard` on both surfaces.
- An audit of the cards at `d2089d79f` found card UI outside that frame's rows:
    - Four cards draw a value through `custom(...)`: the Token `Token` row, the ALT `Recent Slot` row, the Ed25519 `Signature` and `Message` rows, and the Pyth `Attributes (JSON)` row.
    - The Anchor argument fallback draws a JSON tree through a `custom` value. It builds the value as an object literal, so a search for `custom(` misses it. The type checker found it.
    - `PmpDetailsCard` passes its own table rows to `DecodedInstructionCard` as children.
    - Two placeholders skip the frame. A CPI that the page cannot resolve draws `ErrorCard`. The PMP card draws `LoadingCard` while its code loads.
- The card UI lives in three folders: `app/components/common/` (`BaseInstructionCard`, `BaseRawDetails`, `BaseRawParsedDetails`), `app/shared/ui/` (`AccountRoleBadges`, `expandable-row`), and the entity. `TxInstructionShell` imports `BaseInstructionCard`, and `BaseInstructionCard` imports `EventRows` and `ProgramField` from inside the entity, so the two folders import each other.
- The spec allows both kinds of card markup. It calls `custom` "the sole markup door", and its scenario "Card needing real markup" lets a card pass its own children.
- The frame props are declared three times: `InstructionProps` in `BaseInstructionCard` and in `TxInstructionShell`, and `InstructionShellProps` on the surface. The three lists differ. `InstructionCardView` splits the node into `ix`, `index`, `childIndex` and `raw`, and passes the nested cards back down as `childCards`.
    - The raw view state is three optional props: `raw`, `onRequestRaw` and `rawUnavailable`. They allow 8 combinations, and `TxInstructionShell` produces 4.
    - `defaultRaw` disables the Raw toggle. Every card that passes it passes no children.
    - No caller passes `headerButtons`.
    - The inspector sets `collapsible` and `validateProgram` by wrapping `BaseInstructionCard` in its own `Shell`. Only review enforces the spec rule that a `Shell` passes props and draws no markup.
- A program card takes `ix` beside `node`. On a route that rebuilds the node from the dispatch result, `ix` and `node.ix` are the same object.

## Why

A card that draws its own markup can drift from its neighbours, and a reviewer has to find it by reading every card. The audit needed a script and the type checker to find all seven cases. Deleting `custom` and the children of `DecodedInstructionCard` removes both ways a card passed markup into the shared rows, so the type checker rejects a new case.

A prop that repeats another prop can disagree with it, and a set of optional props allows states that no caller produces. The frame takes the node once, the raw view state as one union, and the surface flags as data, so the type checker rejects the other states. A program card takes the decoded payload as `parsed`, so it receives each fact once.

### Alternatives considered

- **Move the generic components into the entity as well.** Rejected. Non-card files import each of them: `Address` 41 files, `BaseTable` 35, `ErrorCard` 36, `Copyable` 14. Account pages and the inspector would then import from `@entities/instruction-card`, which points the dependency the wrong way. They stay where they are, and only the entity imports them for a card.
- **Move the router into the entity.** Rejected. `InstructionNodeCard` imports the card of every program, and `boundaries/dependencies` lets an entity import only `shared` and its own slice.
- **Keep `custom` and catch new uses in review.** Rejected. Review did not catch the Anchor fallback, because it is an object literal.
- **Remove `children` from `InstructionCardView`, so the type allows only fields.** Rejected. `TokenBatchCard` calls one mint hook for each sub-instruction, so each sub-instruction must be a component. Review keeps the children of a card to entity components.
- **Enforce the rule with a lint rule on the card files.** Rejected. The rule needs a custom ESLint plugin that tracks where each drawn component and each child comes from, which is more config than the rule is worth.
- **Keep the PMP payload rows in the PMP feature and pass them as children.** Rejected, because the card would draw its own rows. The trade-off: `note`, `rawData`, `documentText` and `payload` have one user, the PMP card, so the scenario "Repeated shape earns its own kind" does not cover them. With `custom` deleted, a field kind is the only way to draw these rows.
- **Keep `next/dynamic` for the PMP card.** Rejected. Its `loading` callback receives the loading state, not the props of the card, so the placeholder cannot draw the frame of the node. `React.lazy` with `Suspense` gives the fallback the node.
- **Keep `Shell` on the surface and narrow its props to the props of `InstructionCardView`.** Rejected. The surface would still hold a component, so the rule that a `Shell` draws no markup stays a review rule.
- **Keep `defaultRaw` and reject it together with children in the type.** Rejected. Every card that has no children opens on the raw view, so the prop repeats what the children already say.
- **Delete `InstructionNode.ix` and give the node an optional parsed payload.** Rejected for this change. The frame still needs the RPC-parsed instruction for the JSON in the raw view, and the change touches every node builder and most card tests. The card props no longer depend on `node.ix`, so that change touches no card.
- **Name the card prop `payload`.** Rejected. The field kind `payload` already names the PMP block.

## What Changes

- Move `BaseInstructionCard`, `BaseRawDetails`, `BaseRawParsedDetails`, `AccountRoleBadges` and `ExpandableRow` into `app/entities/instruction-card/ui/`, with their stories and specs.
- Split `InstructionCardFrame` out of `BaseInstructionCard`. The frame draws the index badge, the title, the scroll anchor and the table, so a placeholder with no instruction draws the same chrome.
- Move `inspectorSurface` into the entity. It takes `Card` from the page, as `TxInstructionSurface` does.
- Add the field kinds `slot` and `json`, and a `tokenLabel` option on `address`. Delete `custom`.
- Add the block kinds `note`, `rawData`, `documentText` and `payload`. A block fills the row. `FieldBlock` draws it.
- `InstructionFieldRows` takes `columns`, so its rows span a table wider than two columns. `DecodedInstructionCard` takes `fields` after the arguments, in place of `children`.
- Draw the PMP payload as fields. The rows come from the pure module `pmp-payload-fields.ts`. `DataPayloadSection` is deleted.
- Draw a CPI that the page cannot resolve in `InstructionCardFrame`, with a note that names its position.
- Load the PMP card with `React.lazy`. `LoadingDetailsCard` draws the frame of the node while the code loads.
- Replace `Shell` on `InstructionSurface` with `rawInstructions`, `collapsible` and `validateProgram`. `TxInstructionSurface` reads the raw transaction once. Delete `TxInstructionShell` and `InstructionShellProps`.
- `BaseInstructionCard` takes `node`, `rawSource`, `collapsible` and `validateProgram`, and draws the nested cards from `node.children`. `rawSourceOf` derives `rawSource` from the node and `rawInstructions`.
- A card with no children opens on the raw view, and its Raw toggle is disabled. Delete `defaultRaw` and `headerButtons`.
- `InstructionCardFrame` and `EventRows` take `position`, and `positionLabel` formats it. `ProgramField` takes `validateProgram` in place of `showExtendedInfo`.
- `BaseRawDetails` requires `ix`, so its loader is deleted. No caller passed it an empty `ix`.
- Program cards take `parsed` in place of `ix`. The router takes `parsed` from the dispatch result.
- Stories apply `withTxInstructionSurface` inside the transactions decorator, because the surface reads the raw transaction.

## Impact

- **Ed25519.** The signature and message bytes show as copyable code that wraps. Anchor bytes show the same way.
- **Pyth.** `Update Product` shows each attribute as a copyable row under an `Attributes` heading, not as one JSON block. `Publish Slot` links to its block and shows thousands separators.
- **PMP.**
    - `Data Hash` shows the full hash, copyable.
    - The account that holds the payload shows as an address row, labelled `Source buffer account` or `Metadata account`.
    - `Reading account...` shows as a note.
    - The PMP specs query by role and text, because the card no longer sets `pmp-*` test ids.
- **Unresolved CPI.** The card shows the position badge, the title `Unknown Instruction`, and the note `Could not display instruction #i.j, please report`.
- **PMP loading.** The card shows the frame of the node, titled `<program>: Loading`, in place of a spinner card.
- **No change.** The Token `Token` row, the ALT `Recent Slot` row and the Anchor fallback render the same components as before.
- **Stories.** The moved stories appear under `Entities/Instruction Card/`. The `BaseRawDetails` loading story is deleted.
- **Props redesign.** No change on screen. The Raw button requests the raw transaction in the same cases as before.
