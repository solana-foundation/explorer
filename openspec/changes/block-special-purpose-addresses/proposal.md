# Proposal: Connect only to public unicast addresses in the metadata proxy

## Context

- `isPrivateIP` in `app/api/metadata/proxy/feature/ip.ts` blocks a resolved address only when it matches one of eleven hand-written CIDR blocks; every other address counts as public.
- `lookupHostnameSafely` applies that check to every address DNS returns and pins the connection to them, so a gap in the list is a gap in the SSRF defence: a hostname with an AAAA record of `::` passes the check, and Linux routes a connection to `::` to the local host.
- Addresses outside the list include `::`, `64:ff9b::/96` (which embeds any IPv4 address, `169.254.169.254` included), `2002::/16`, multicast, limited broadcast, and the reserved and benchmarking blocks.
- This extends the decision recorded in `add-metadata-proxy`, requirement "The proxy SHALL block SSRF via private-IP rejection and DNS pinning", which names only private and reserved ranges without defining them.
- CodeQL alert `js/request-forgery` #8 flags the proxy's `fetch`. That alert stays open by design: an open image proxy cannot restrict hosts, since creators store metadata on any host.

## Why

The proxy connects only to unicast addresses outside every block of the IANA special-purpose registries, and refuses the rest. The registries are the published source for which blocks are not ordinary public hosts, so the rule follows them instead of a list the code maintains by hand:

- IANA IPv4 Special-Purpose Address Registry and IANA IPv6 Special-Purpose Address Registry, defined by RFC 6890: every entry is refused, including the entries marked "Globally Reachable: True".
- Multicast, which those registries do not list: RFC 5771 (`224.0.0.0/4`) and RFC 4291 §2.7 (`ff00::/8`).

Alternatives considered:

- **Extend the CIDR lists by hand.** Rejected: the lists drift from the registries, which is how `::` and the translation prefixes were missed.
- **Allow-list hosts.** Rejected: it would break every creator who stores metadata outside the list, and the SSRF risk sits in the resolved address, not the host name.
- **Keep the entries marked "Globally Reachable: True" (AS112, AMT, anycast relays).** Rejected: no metadata or image host is served from them, and one rule is simpler to verify than an exception list.

## What Changes

- `isPrivateIP` returns `false` only for an address that `ipaddr.js` classifies as `unicast`; an IPv4-mapped IPv6 address is judged as its IPv4 address.
- Four registry blocks missing from the `ipaddr.js` range table are refused explicitly: `64:ff9b:1::/48` (RFC 8215), `100:0:0:1::/64` (RFC 9780), `3fff::/20` (RFC 9637), and `5f00::/16` (RFC 9602).
- The two hand-written CIDR lists are removed.

## Impact

- No change for image and metadata hosts: every public host resolves to a public unicast address.
- An IPv4-mapped IPv6 address, such as `::ffff:8.8.8.8`, was refused as a whole and is now judged as its IPv4 address.
- Hosts that resolve only to a refused block now get `403`, as private addresses already do.
- CodeQL alert #8 remains open; it is dismissed as "won't fix" with this change as the reference.
