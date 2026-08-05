## ADDED Requirements

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

### Requirement: Navigation params SHALL carry customUrl only when the target cluster is Custom

Preserving cluster params across navigation SHALL propagate `customUrl` only when the resulting cluster is `custom`, and SHALL strip it for every other cluster. A `customUrl` is meaningful only on the Custom cluster — it is that cluster's endpoint, and every other cluster resolves from its own configured URL — so propagating it elsewhere ships the user's endpoint to a cluster that ignores it.

Where params are merged with an override, the decision SHALL use the **merged** cluster, not the incoming one, so an override that switches away from Custom drops the endpoint instead of inheriting it.

This requirement governs navigation-param preservation only. Generated share links and the cluster switcher are out of scope for this change and continue to emit `customUrl` for the Custom cluster.

#### Scenario: Navigating while a non-custom cluster is selected

- **WHEN** cluster params are preserved for a navigation target whose cluster is not `custom`
- **THEN** `customUrl` SHALL NOT appear in the resulting URL

#### Scenario: Navigating while the Custom cluster is selected

- **WHEN** cluster params are preserved for a navigation target whose cluster is `custom`
- **THEN** `customUrl` SHALL be carried forward unchanged

#### Scenario: An override switches the cluster away from Custom

- **WHEN** additional params override the cluster from `custom` to a non-custom cluster
- **THEN** the decision SHALL be made on the merged cluster
- **AND** the previously-present `customUrl` SHALL be stripped from the result
