## ADDED Requirements

### Requirement: The proxy SHALL connect only to public unicast addresses

For each hop, the proxy SHALL refuse with `403` any hostname that resolves to at least one address that is not public unicast. Refused addresses are every block in the IANA IPv4 and IPv6 Special-Purpose Address Registries (RFC 6890), whatever its "Globally Reachable" value, every multicast address (RFC 5771, RFC 4291 §2.7), and the blocks `64:ff9b::/96` (RFC 6052), `64:ff9b:1::/48` (RFC 8215), `2002::/16` (RFC 3056), and `2001::/32` (RFC 4380), which embed or tunnel another address. An IPv4-mapped IPv6 address SHALL be judged as its IPv4 address.

This requirement intentionally extends the `add-metadata-proxy` requirement "The proxy SHALL block SSRF via private-IP rejection and DNS pinning": it defines which ranges that requirement refuses.

#### Scenario: Unspecified address

- **WHEN** a hostname resolves to `::`
- **THEN** the proxy SHALL respond `403` and SHALL NOT open a connection

#### Scenario: Address embedded in a translation prefix

- **WHEN** a hostname resolves to `64:ff9b::a9fe:a9fe`, the NAT64 form of `169.254.169.254`
- **THEN** the proxy SHALL respond `403`

#### Scenario: Multicast or reserved address

- **WHEN** a hostname resolves to `224.0.0.1`, `ff02::1`, `240.0.0.1`, or `198.18.0.1`
- **THEN** the proxy SHALL respond `403`

#### Scenario: Anycast service address marked globally reachable

- **WHEN** a hostname resolves to `192.175.48.1` or `2001:3::1`
- **THEN** the proxy SHALL respond `403`

#### Scenario: Public unicast address

- **WHEN** a hostname resolves only to public unicast addresses, such as `8.8.8.8` or `2606:4700:4700::1111`
- **THEN** the proxy SHALL fetch the resource
