# Crawlers

A crawler is welcome when its visits bring readers to the explorer: link previews, search results, or an answer a
person asked an assistant for. A crawler is blocked when its visits only feed the crawler's owner. Every explorer
page is rendered on request and most of them call RPC, so an unwanted crawl is paid for in function invocations and
RPC quota, not bandwidth.

## Two layers

| Layer                                               | What it does                    | Works on                                                                               |
| --------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| [`public/robots.txt`](../public/robots.txt)         | Asks a crawler to stay out      | Crawlers that declare a user agent and state that they honor the file                  |
| WAF custom rule, see [`firewall.md`](./firewall.md) | Refuses the request at the edge | Any request whose user agent can be matched, including crawlers that ignore robots.txt |

Start with robots.txt. It is the documented channel, it costs nothing, and the crawler's vendor states whether it is
honored. Escalate to a WAF rule when the vendor states that the crawler may bypass robots.txt, or when the log
filter in [Verifying](#verifying) shows the crawl continuing after the file has been out for a few days.

A robots.txt group applies to the most specific `User-agent` match only, so a group for a named crawler replaces the
`User-agent: *` block for that crawler instead of adding to it. That is why a block is a separate group with its own
`Disallow: /`.

## Meta

Meta runs several crawlers under different user agents, and only some of them return anything to the explorer. The
source of record is Meta's
[web crawlers page](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers). Quotes below are from
that page; the list there is Meta's to change, so it is not copied here.

| User agent             | Meta's stated purpose                                                                      | Decision | Why                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `facebookexternalhit`  | "Crawl the content of an app or website that was shared on one of Meta's family of apps"   | keep     | Renders link previews on Facebook, Instagram, and WhatsApp. The `/og/` bypass rules exist for it. |
| `meta-externalfetcher` | "Fetches individual links at a user's request"                                             | keep     | One fetch per question a person asked Meta AI. Same class as an MCP client, and low volume.       |
| `meta-externalagent`   | "Crawls the web for use cases such as training foundation AI models or improving products" | block    | Returns no readers. It crawls dynamic pages at scale, and each page costs RPC calls.              |

`meta-externalagent` is blocked in robots.txt only. Meta lists it among the crawlers that respect the file, and the
crawl volume, not its presence, is the problem, so the polite layer is the right first step.

`meta-externalfetcher` cannot be blocked in robots.txt. Meta states that the "crawler may bypass robots.txt because it
performs fetches requested by the user". Do not add a group for it; a group would document an intent the crawler
ignores. If its volume ever matters, the control is a WAF rate limit keyed by user agent, in the shape of
`Rate limit MCP` in [`firewall.md`](./firewall.md), not a deny.

## Adding a block

1. Confirm the crawler's purpose and its robots.txt policy on the vendor's page. Link that page from this document.
2. Add a group to [`public/robots.txt`](../public/robots.txt) with the vendor's user agent token and `Disallow: /`.
3. Wait for the crawler to refresh the file. Vendors do not publish the interval; expect days.
4. If the crawl continues, add a WAF rule: `User Agent` `Contains` `<token>`, action `Deny`. Place it above every
   `Bypass` rule, because a `Bypass` that matches first skips the rules below it and would let the crawler through on
   `/og/` and receipt pages. Rule semantics are in [`firewall.md`](./firewall.md).

## Verifying

- Filter the Vercel request log by user agent containing the token. Compare request counts per day before the
  change and after the crawler's next robots.txt fetch.
- Confirm the served file carries the group:

    ```sh
    curl -A meta-externalagent https://explorer.solana.com/robots.txt
    ```

    The `-A` flag only changes what curl sends; robots.txt is static, so the output is the same for every client. The
    check confirms the deploy, not the crawler's behavior.
