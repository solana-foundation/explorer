# Contributor's Guide

Thank you for your interest in contributing to the Solana Explorer project! This guide will help you understand how to contribute effectively, including testing protocol integrations, ensuring CI/CD passes, and handling security-related features. 

***Please do not submit one line PRs that upgrade CI workflows or dependencies unless they are related to bug fixes or performance improvements.*** If you have small changes you would like to see addressed, please file an issue instead. Thank you.

## Table of Contents

-   [Getting Started](#getting-started)
-   [Development Environment](#development-environment)
-   [Testing Protocol Integrations](#testing-protocol-integrations)
-   [CI/CD Requirements](#cicd-requirements)
-   [Security Features](#security-features)
-   [Bug Reporting](#bug-reporting)
-   [Pull Request Process](#pull-request-process)
-   [Code Style](#code-style)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/explorer.git`
3. Install dependencies: `pnpm install`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

> **Important Note**: We are currently not accepting PRs that add wallet adapter or similar functionality to the Explorer. Please check with maintainers before starting work on such features.

## Development Environment

Contributing to the Explorer requires `pnpm` version `9.10.0`.
Once you have this version of `pnpm`, you can continue with the following steps.

-   Copy `.env.example` into `.env` & fill out the fields with custom RPC urls \
    from a Solana RPC provider. You should not use `https://api.mainnet-beta.solana.com` \
    or `https://api.devnet.solana.com` or else you will get rate-limited. These are public \
    endpoints not suitable for application development. You must set these URLs with \
    endpoints from your own provider.

-   `pnpm i` \
    Installs all project dependencies using pnpm package manager. This will create a \
    `node_modules` directory and install all packages specified in `package.json`, \
    including both dependencies and devDependencies.

-   `pnpm dev` \
    Runs the app in the development mode. \
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser. \
    \
    The page will reload if you make edits. \
    You will also see any lint errors in the console.

-   (Optional) `pnpm test` \
    Launches the test runner in the interactive watch mode.

### Troubleshooting

Still can't run the explorer with `pnpm dev`?
Seeing sass dependency errors?
Make sure you have `pnpm` version `9.10.0`, `git stash` your changes, then reset to master with `rm -rf node_modules && git reset --hard HEAD`. 
Now running `pnpm i` followed by `pnpm dev` should work. If it is working, don't forget to reapply your changes with `git stash pop`.

This project uses:

-   Next.js 14.x
-   React 18.x
-   TypeScript
-   Jest for testing
-   pnpm as the package manager

## Testing Protocol Integrations

When integrating new protocols or modifying existing ones, comprehensive testing is required to ensure the UI correctly displays protocol data.

### UI Testing Requirements

For protocol integrations, tests must verify that the specific protocol data is correctly pinned on the UI by inspecting the rendered HTML. This approach is similar to what's implemented in the Lighthouse integration.

#### Example: Lighthouse Test Suite

The Lighthouse integration provides an excellent example of how to test protocol integrations. You can find the test suite at:

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

### Testing Best Practices

1. **Test Real-World Scenarios**: Use real transaction data examples when possible
2. **Test Edge Cases**: Include tests for unusual or edge-case protocol data
3. **Mock External Dependencies**: Use Jest's mocking capabilities for external services
4. **Snapshot Testing**: Consider using snapshot tests for UI components to detect unintended changes

## CI/CD Requirements

All contributions must pass CI/CD checks before requesting a review. The project uses GitHub Actions for continuous integration and deployment.

### CI Workflow

The CI workflow (`ci.yaml`) runs on every pull request and includes:

-   Building the project
-   Running tests
-   Linting checks

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

For bugs relating to Solana Verify (aka Verified Builds), please send email to disclosures@solana.org.

For other security vulnerabilities, please do NOT report them publicly on GitHub Issues. Instead, use our dedicated bug bounty form at [https://example.com/bug-bounty](https://example.com/bug-bounty).

### Non-Security Bugs

For non-security bugs, please use GitHub Issues with the following information:

-   Clear description of the issue
-   Steps to reproduce
-   Expected vs. actual behavior
-   Screenshots if applicable
-   Environment information (browser, OS, etc.)

## Pull Request Process

1. Create a branch with a descriptive name (`feature/your-feature` or `fix/your-fix`)
2. Make your changes, following the code style guidelines
3. Add tests for your changes
4. Ensure all tests pass locally
5. Push your changes and create a pull request
6. Wait for CI/CD to pass
7. Include screenshots of protocol screens if applicable
8. Request review ONLY after CI/CD has passed and screenshots have been uploaded
