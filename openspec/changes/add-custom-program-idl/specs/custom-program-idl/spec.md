## ADDED Requirements

### Requirement: A custom IDL stays in the browser

The Explorer MUST NOT send a custom IDL to its server or write the custom IDL into a URL. An analytics event MUST NOT contain text from a custom IDL, except its program address.

#### Scenario: Adding a custom IDL

- **WHEN** the user adds a custom IDL for a program
- **THEN** a network request MUST NOT contain the custom IDL
