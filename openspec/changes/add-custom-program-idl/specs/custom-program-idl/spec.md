## ADDED Requirements

### Requirement: A custom IDL stays in the browser

The Explorer MUST NOT send a custom IDL to its server or write the custom IDL into a URL. An analytics event MUST NOT contain text from a custom IDL, except its program address.

#### Scenario: Adding a custom IDL

- **WHEN** the user adds a custom IDL for a program
- **THEN** a network request MUST NOT contain the custom IDL

#### Scenario: Using a selected custom IDL on the Interact tab

- **WHEN** the user expands, simulates or sends an instruction of a selected custom IDL
- **THEN** an analytics event MUST NOT contain an instruction name, a section name or an error text from the custom IDL

### Requirement: A selected custom IDL replaces the on-chain IDLs

While the custom IDL of a program is selected and the Explorer can read the selection, the Explorer MUST use it in place of the on-chain IDLs of that program on every cluster. The PMP-first default tab applies only while the on-chain IDLs are selected. The Program Multisig card and the verified-build check MUST keep the on-chain IDL.

#### Scenario: Custom selected while a PMP IDL is present

- **WHEN** a program has a PMP IDL and its custom IDL is selected
- **THEN** the IDL tab MUST show the custom IDL
- **AND** the instruction names, account data and program log names of the program MUST NOT come from the PMP IDL

#### Scenario: On-chain selected while a PMP IDL is present

- **WHEN** a program has a PMP IDL and a custom IDL, and the user selects On-chain
- **THEN** the IDL tab MUST show the PMP IDL

#### Scenario: Custom selected for Squads or the verify program

- **WHEN** the Squads program or the verify program has a selected custom IDL
- **THEN** the Program Multisig card and the verified-build check MUST decode with the on-chain IDL of that program
