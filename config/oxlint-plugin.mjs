// Project-local rules loaded by oxlint as a JS plugin (see `jsPlugins` in oxlint.config.ts).

// Mirrors ESLint's core `no-restricted-syntax`, which oxlint does not implement natively: each option is
// an esquery selector reported with its message.
const noRestrictedSyntax = {
    create(context) {
        return Object.fromEntries(
            context.options.map(({ selector, message }) => [selector, node => context.report({ message, node })]),
        );
    },
    meta: {
        docs: { description: 'Disallow syntax matched by the configured esquery selectors.' },
        schema: {
            items: {
                properties: { message: { type: 'string' }, selector: { type: 'string' } },
                required: ['selector', 'message'],
                type: 'object',
            },
            type: 'array',
        },
        type: 'suggestion',
    },
};

// A hook is never a component, so it never needs to *be* a client boundary — and `'use client'` costs
// it the only build-time guard available: a server caller of a directive-carrying module gets a
// client reference and fails at runtime, while `client-only` fails `next build` with an import trace.
const preferClientOnlyInHooks = {
    create(context) {
        return {
            Program(node) {
                for (const statement of node.body) {
                    // Directives only count in the leading prologue, so stop at the first real statement.
                    if (statement.type !== 'ExpressionStatement' || statement.expression.type !== 'Literal') {
                        return;
                    }
                    if (statement.expression.value !== 'use client') continue;
                    context.report({
                        messageId: 'preferClientOnly',
                        node: statement,
                    });
                    return;
                }
            },
        };
    },
    meta: {
        docs: { description: "Suggest `import 'client-only'` over 'use client' for hook modules." },
        messages: {
            preferClientOnly:
                "Prefer `import 'client-only'` over 'use client' in a hook module: a server caller then fails `next build` with an import trace instead of throwing at runtime. Verify with a build — a failure means something in the server graph reaches this module, usually a barrel re-export worth splitting.",
        },
        schema: [],
        type: 'suggestion',
    },
};

const DISABLE_DIRECTIVES = new Set([
    'eslint-disable',
    'eslint-disable-line',
    'eslint-disable-next-line',
    'oxlint-disable',
    'oxlint-disable-line',
    'oxlint-disable-next-line',
]);

// Stands in for `@eslint-community/eslint-comments/no-unlimited-disable`, which crashes under oxlint's
// JS plugin runtime. A directive without rule names silences every rule, including ones added later.
const noUnlimitedDisable = {
    create(context) {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    const [directive, ...ruleNames] = comment.value
                        .split('--')[0]
                        .replaceAll('\n', ' ')
                        .replaceAll('\t', ' ')
                        .split(' ')
                        .filter(Boolean);
                    if (DISABLE_DIRECTIVES.has(directive) && ruleNames.length === 0) {
                        context.report({ loc: comment.loc, messageId: 'unlimitedDisable', data: { directive } });
                    }
                }
            },
        };
    },
    meta: {
        docs: { description: 'Require rule names in `eslint-disable` / `oxlint-disable` directives.' },
        messages: {
            unlimitedDisable: 'Unexpected unlimited `{{ directive }}` comment. Specify the rules to disable.',
        },
        schema: [],
        type: 'suggestion',
    },
};

const plugin = {
    meta: { name: 'explorer' },
    rules: {
        'no-restricted-syntax': noRestrictedSyntax,
        'no-unlimited-disable': noUnlimitedDisable,
        'prefer-client-only-in-hooks': preferClientOnlyInHooks,
    },
};

export default plugin;
