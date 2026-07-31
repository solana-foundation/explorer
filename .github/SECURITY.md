# Security Policy

The Solana Explorer team takes the security of this project seriously. We
appreciate the efforts of security researchers and the wider community in
helping us keep the Explorer and its users safe.

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

Instead, report them by email to **disclosures@solana.org**.

This includes vulnerabilities relating to Solana Verify (aka Verified Builds)
as well as any other security issue affecting the Explorer.

To help us triage and prioritize your report, please include as much of the
following as you can:

-   A clear description of the vulnerability and its potential impact
-   The type of issue (e.g. XSS, CSRF, injection, supply-chain, information
    disclosure, SSRF via a proxied RPC/metadata request, etc.)
-   Step-by-step instructions to reproduce the issue
-   The affected URL(s), page(s), or component(s), and the cluster if relevant
    (mainnet-beta, devnet, testnet, custom RPC)
-   Proof-of-concept code, screenshots, or a short video where applicable
-   Any suggested mitigation you may have

If you would like to encrypt your report, mention this in an initial email and
we will coordinate a secure channel.

## Scope

This policy covers the Solana Explorer web application in this repository,
including its Next.js API routes (e.g. the RPC, metadata, and IDL proxy
endpoints) and the workspace packages under `packages/`.

The following are **out of scope** here and should be reported to their
respective projects:

-   The Solana protocol / validator client — report via the Agave security
    process at <https://github.com/anza-xyz/agave/security>
-   Third-party RPC providers (e.g. Triton, Helius) and other upstream services
-   Vulnerabilities that exist only in a fork or in a self-hosted deployment
    with modified configuration

### Generally not eligible

-   Reports from automated scanners without a demonstrated, exploitable impact
-   Missing security headers or best-practice recommendations with no concrete
    exploit
-   Denial of service caused solely by sending a high volume of requests
-   Social engineering, phishing, or physical attacks

## Our Commitment

When you report a vulnerability in good faith under this policy, we will:

-   Acknowledge receipt of your report as promptly as we can
-   Investigate and work to validate the issue
-   Keep you informed of our progress toward a fix
-   Credit you for the discovery once the issue is resolved, if you would like

## Safe Harbor

We consider security research and vulnerability disclosure conducted in good
faith and in accordance with this policy to be authorized. Please make a good
faith effort to avoid privacy violations, degradation of the service, and
destruction or exfiltration of data. Only interact with accounts you own or
have explicit permission to test, and give us a reasonable amount of time to
address an issue before any public disclosure.

## Supported Versions

The Explorer is a continuously deployed web application; security fixes are
applied to the latest `master` branch and the live deployment. We do not
maintain or backport fixes to older tags or releases.
