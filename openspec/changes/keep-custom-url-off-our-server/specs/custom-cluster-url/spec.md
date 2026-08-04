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
