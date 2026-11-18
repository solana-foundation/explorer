# custom-cluster-url Specification

## Purpose
The Explorer connects to a custom RPC URL from a link only with the user's consent, and keeps that URL off its own server.
## Requirements
### Requirement: Server code SHALL NOT resolve a client-supplied custom RPC URL

Server-side RPC endpoint resolution SHALL derive the endpoint only from server-configured `*_RPC_URL` environment variables (or their public defaults), never from a value supplied by the client. The server-side resolver (`serverClusterUrl`) MUST NOT accept a `customUrl` argument, and its type MUST exclude `Cluster.Custom` so a custom cluster cannot be resolved to an endpoint on the server. Any server entry point that receives a `cluster=custom` selection SHALL reject it or map it to a known cluster via chain identity — it MUST NOT issue an outbound request to a client-supplied URL.

#### Scenario: Server resolves an RPC endpoint

- **WHEN** server code (an API route, server component, or metadata generator) resolves the RPC endpoint for a request
- **THEN** the endpoint SHALL come from a server-configured environment variable or public default
- **AND** no client-supplied `customUrl` value SHALL be read, forwarded, or used to build the outbound request

#### Scenario: A request carries a custom cluster selection

- **WHEN** a request to the Explorer's own server carries `cluster=custom`
- **THEN** the handler SHALL reject it (e.g. HTTP 400) or resolve it to a known cluster by genesis hash
- **AND** SHALL NOT attempt to connect to any custom endpoint

### Requirement: Client fetches to the Explorer's own API SHALL NOT carry customUrl

Client code SHALL NOT include a `customUrl` query parameter or body field on any fetch it issues to the Explorer's own `/api/*` routes. Custom-cluster RPC traffic SHALL be issued directly from the browser to the custom endpoint, not proxied through the Explorer server.

This requirement governs fetches that client code constructs. It does NOT cover the page URL query string: `?cluster=custom&customUrl=…` remains the source of truth for the active custom endpoint, so page navigations and SSR requests still carry the value to the Explorer server. See `proposal.md` ("Known residual") for why that is out of scope here.

#### Scenario: Token image is requested on the Custom cluster

- **WHEN** the client fetches a token image while the active cluster is Custom
- **THEN** the request to `/api/token-image` SHALL NOT include a `customUrl` parameter
- **AND** the image SHALL simply not render (the Explorer server does not serve custom-cluster images)

#### Scenario: A new client fetch needs the active cluster

- **WHEN** client code adds a fetch to an Explorer `/api/*` route that depends on the active cluster
- **THEN** it SHALL identify the cluster by its slug alone
- **AND** SHALL NOT forward the custom endpoint, because no server route can consume it

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

