# Contributor's Guide

Thank you for your interest in contributing to the Solana Explorer project! This guide will help you understand how to contribute effectively, including testing protocol integrations, ensuring CI/CD passes, and reporting bugs and security vulnerabilities. 

*Please do not submit trivial drive-by PRs — copyright bumps, whitespace tweaks, single-character fixes, one-off CI workflow changes, or dependency upgrades — unless they fix a bug or improve performance.* If you have small changes you would like to see addressed, please file an issue instead. Thank you.

## Table of Contents

-   [Getting Started](#getting-started)
-   [Development Environment](#development-environment)
-   [Testing Protocol Integrations](#testing-protocol-integrations)
-   [CI/CD Requirements](#cicd-requirements)
-   [Bug Reporting](#bug-reporting)
-   [Pull Request Process](#pull-request-process)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/explorer.git`
3. Install dependencies: `pnpm i --frozen-lockfile`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

> **Using an AI coding agent?** Point Claude Code, Cursor, Copilot, or similar tools at [`AGENTS.md`](./AGENTS.md) — it captures the project's architectural conventions and code style so the agent matches the codebase.

> **Important Note**: Wallet connection is intentionally scoped to the interactive IDL feature (executing program instructions defined by Anchor or Codama IDLs). PRs that broaden wallet adapter usage, add new wallet-connected flows, or introduce general transaction-signing UI elsewhere will not be accepted. Please check with maintainers before starting related work.

## Development Environment

This project uses:

-   Next.js 16.x (Turbopack)
-   React 19.x
-   TypeScript
-   Vitest for testing
-   pnpm as the package manager

New components should use Tailwind for styling. Legacy SCSS under `app/scss/` (Dashkit theme) is being phased out — only modify it when changing existing components that still depend on it.

Contributing to the Explorer requires the Node and `pnpm` versions declared in [`package.json`](./package.json) (`engines.node` and `packageManager`).
Once you have these versions installed, you can continue with the following steps.

-   Copy `.env.example` into `.env` & fill out the fields with custom RPC urls \
    from a Solana RPC provider. You should not use `https://api.mainnet-beta.solana.com` \
    or `https://api.devnet.solana.com` or else you will get rate-limited. These are public \
    endpoints not suitable for application development. You must set these URLs with \
    endpoints from your own provider.

-   `pnpm i --frozen-lockfile` \
    Installs project dependencies. Matches what CI runs — fails fast if `pnpm-lock.yaml` is out of date instead of silently updating it.

-   `pnpm dev` \
    Runs the app in the development mode. \
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser. \
    \
    The page will reload if you make edits. \
    You will also see any lint errors in the console.

-   `pnpm test` \
    Runs the Vitest suite once. Use `pnpm test:watch` for the interactive watch mode.

### Troubleshooting

Still can't run the explorer with `pnpm dev`?
Seeing dependency errors during install or first run?
Make sure your `pnpm` version matches `packageManager` in `package.json`, `git stash` your changes, then reset to master with `rm -rf node_modules && git reset --hard HEAD`. 
Now running `pnpm i --frozen-lockfile` followed by `pnpm dev` should work. If it is working, don't forget to reapply your changes with `git stash pop`.

## Testing Protocol Integrations

For non-protocol changes, follow the test patterns near the file you're modifying (`__tests__/` next to the code). The remainder of this section covers the additional requirements for protocol integrations.

When integrating new protocols or modifying existing ones, comprehensive testing is required to ensure the UI correctly displays protocol data.

### UI Testing Requirements

For protocol integrations, tests must verify that the specific protocol data is correctly rendered in the UI by inspecting the rendered HTML. Mock external dependencies with `vi.mock` (Vitest); the Lighthouse suite below shows the pattern.

#### Example: Lighthouse Test Suite

The Lighthouse test suite at the path below illustrates the pattern:

-   `app/components/instruction/lighthouse/__tests__/LighthouseDetailsCard.test.tsx`

This test suite demonstrates:

1. How to mock dependencies for isolated testing
2. How to verify that protocol-specific data is correctly rendered in the UI
3. How to test different instruction types and their rendering
4. How to use data-testid attributes to select and verify specific UI elements

Here's a simplified example from the Lighthouse tests:

```typescript
it('renders Assert Sysvar Clock instruction', () => {
    const ix = {
        data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
        keys: [],
        programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
    };

    render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

    // Verify the component renders the correct title
    expect(screen.getByText('Lighthouse: Assert Sysvar Clock')).toBeInTheDocument();

    // Verify specific data fields are rendered correctly
    const ixArgs0a = screen.getByTestId('ix-args-0-1');
    expect(ixArgs0a).toHaveTextContent('logLevel');
    expect(ixArgs0a).toHaveTextContent('number');
    expect(ixArgs0a).toHaveTextContent('0');

    const ixArgs0b = screen.getByTestId('ix-args-0-2');
    expect(ixArgs0b).toHaveTextContent('assertion');
    expect(ixArgs0b).toHaveTextContent('Slot');

    // More assertions...
});
```

#### Data-Testid Attributes

Follow the pattern used in the Lighthouse integration by adding `data-testid` attributes to your components to make them easily selectable in tests, for example:

```tsx
<tr data-testid={`ix-args-${baseKey}`}>
    <td>{fieldName}</td>
    <td>{fieldType}</td>
    <td className="text-lg-end">{fieldValue}</td>
</tr>
```

## CI/CD Requirements

All contributions must pass CI/CD checks before requesting a review. The project uses GitHub Actions for continuous integration and deployment.

### CI Workflow

The CI workflow (`ci.yaml`) runs on every pull request and must pass before review. To reproduce the workflow locally without pushing, run it with [`act`](https://github.com/nektos/act).

### Requirements Before Requesting Review

1. **All CI/CD Checks Must Pass**: Ensure all GitHub Actions workflows complete successfully
2. **Screenshots Required**: For protocol screens, include screenshots in your PR description showing the UI rendering of the protocol data
3. **Test Coverage**: Ensure your changes are covered by tests, especially for protocol integrations

### Running Tests Locally

Before submitting a PR, run tests locally to ensure they pass:

```bash
# Run tests in watch mode during development
pnpm test

# Run tests in CI mode (same as CI/CD)
pnpm test:ci
```

## Bug Reporting

### Security Vulnerabilities

Please do NOT report security vulnerabilities publicly on GitHub Issues. Instead, email disclosures@solana.org — this includes bugs relating to Solana Verify (aka Verified Builds) as well as any other security issues.

### Non-Security Bugs

For non-security bugs, please use GitHub Issues with the following information:

-   Clear description of the issue
-   Steps to reproduce
-   Expected vs. actual behavior
-   Screenshots if applicable
-   Environment information (browser, OS, etc.)

## Pull Request Process

1. Create a branch with a descriptive name using a conventional prefix — `feat/...`, `fix/...`, `chore/...`, or `hotfix/...` (e.g. `feat/your-feature`)
2. Make your changes, following the code style guidelines
3. Add tests for your changes
4. Push your changes and create a pull request
5. Include screenshots — required for protocol screens, recommended for other UI changes
6. Request review ONLY after CI/CD has passed and screenshots have been uploaded
