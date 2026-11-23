## ADDED Requirements

### Requirement: External links sourced from untrusted data SHALL be scheme-validated before rendering

Any anchor whose `href` is derived from on-chain or other third-party data — NFT/token `external_url`, token `extensions.website`/`bridgeContract`, token-extension `uri`/`link.url`, config-account `website`, security.txt fields, verified-build metadata values — SHALL pass its target through the shared `getSafeExternalHref` guard (`app/shared/lib/url.ts`) before it reaches the DOM, and SHALL render the clickable link only when the value is an absolute `http:`/`https:` URL. This closes the stored-XSS vector where a `javascript:`/`data:`/`vbscript:` scheme in on-chain metadata executes in the Explorer origin on click — `rel`/`target` do not prevent that.

#### Scenario: On-chain field carries a non-http(s) scheme

- **WHEN** an untrusted href value uses a `javascript:`, `data:`, `vbscript:`, or other non-`http(s)` scheme
- **THEN** the component SHALL NOT render an anchor targeting that value
- **AND** SHALL instead omit the link or render plain, non-linked text

#### Scenario: On-chain field carries an http(s) URL

- **WHEN** the value is an absolute `http:`/`https:` URL
- **THEN** the component SHALL render the external link, opening in a new tab with `rel="noopener noreferrer"`

### Requirement: Untrusted external links SHALL render through a single guarded component

Untrusted external links SHALL be rendered through one shared `ExternalLink` component that applies the `getSafeExternalHref` guard and sets `target="_blank"` and `rel="noopener noreferrer"` internally, so an individual call site cannot emit an unguarded anchor by forgetting the check. Call sites SHALL pass the raw URL and link text; they MUST NOT construct the anchor and its safety attributes themselves.

#### Scenario: A new sink renders an untrusted URL

- **WHEN** a component needs to link to an untrusted external URL
- **THEN** it SHALL use the shared `ExternalLink` component rather than a raw `<a href>`
- **AND** the guard and `target`/`rel` attributes SHALL be applied by the component, not the call site
