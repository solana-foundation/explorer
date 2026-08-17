## ADDED Requirements

### Requirement: A custom RPC endpoint from a link SHALL NOT be connected to without consent

The app SHALL NOT issue any request to a `customUrl` supplied by the query string until that endpoint is trusted, and the active cluster SHALL NOT count as evidence of trust. An endpoint is trusted when the persisted developer flag is on, when it is local, when its hostname is in the deployment whitelist, or when the user approved its origin in this browser tab. An untrusted-but-valid endpoint SHALL be surfaced as a pending decision, never substituted silently. A value that is not an absolute http(s) URL SHALL be refused outright.

Approval SHALL be recorded per origin and scoped to the tab. It SHALL survive a reload, since the endpoint remains in the address bar and re-asking on every refresh would be the dominant cost of the prompt. It SHALL NOT outlive the tab, and SHALL NOT be shared with another tab, so a link opened later starts from no approvals.

#### Scenario: A link carries an unapproved remote endpoint

- **WHEN** a visitor opens `?cluster=custom&customUrl=` pointing at a remote host that is neither whitelisted nor approved
- **THEN** the app SHALL NOT connect to that endpoint
- **AND** it SHALL prompt for consent, reporting the cluster as still connecting
- **AND** approving SHALL connect, while declining SHALL navigate to the default cluster

#### Scenario: The endpoint is already trusted

- **WHEN** the endpoint is local, whitelisted by the deployment, on an origin already approved in this tab, or the developer flag is on
- **THEN** the app SHALL connect with no prompt

#### Scenario: The same server is reached under a different key or path

- **WHEN** a later link uses the approved origin with a different path or query
- **THEN** the app SHALL treat it as approved and SHALL NOT ask again

#### Scenario: The page is reloaded on an approved endpoint

- **WHEN** the visitor reloads a page whose `customUrl` names an origin they approved in this tab
- **THEN** the app SHALL connect with no prompt

#### Scenario: The same link is opened in a new tab

- **WHEN** a link naming an origin approved in another tab is opened in a fresh tab
- **THEN** that tab SHALL prompt for its own consent

### Requirement: The whitelist of vouched RPC hosts SHALL be deployment configuration

The set of hostnames that skip consent SHALL come from the `NEXT_PUBLIC_WHITELISTED_RPCS` environment variable, and MUST NOT be hardcoded in the source tree. Entries SHALL be bare lowercase hostnames; an entry carrying a scheme, port, path, credentials or wildcard SHALL be skipped with a warning rather than invalidating the remaining entries. An unset variable SHALL mean no host skips consent.

#### Scenario: The variable is unset

- **WHEN** no whitelist is configured
- **THEN** every remote endpoint arriving from a link SHALL need the user's consent

#### Scenario: One entry is malformed

- **WHEN** the variable contains a valid hostname and a malformed entry
- **THEN** the valid hostname SHALL still be honored
- **AND** the malformed entry SHALL be skipped and logged, never matched loosely

## MODIFIED Requirements

### Requirement: Navigation params SHALL carry customUrl only where the app would honor it

Preserving cluster params across navigation SHALL propagate `customUrl` whenever it parses as an http(s) endpoint, and SHALL strip it otherwise. This question is deliberately weaker than the trust decision: an endpoint awaiting consent MUST survive in-app navigation, or the pending prompt loses the endpoint it is asking about. Keeping the builder no stricter than the reader also prevents it from dropping an endpoint the page is actively using.

Where params are merged with an override, the decision SHALL apply to the merged result.

#### Scenario: Navigating while consent is pending

- **WHEN** the user clicks an in-app link while a custom endpoint awaits consent
- **THEN** the `customUrl` param SHALL be preserved
- **AND** the pending prompt SHALL still be asking about that endpoint

#### Scenario: The param is unusable

- **WHEN** the `customUrl` param is empty or is not an absolute http(s) URL
- **THEN** navigation SHALL strip it
