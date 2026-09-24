---
name: writing
description: >-
  Writing contract for every text an agent produces in this repository: PR and issue bodies, commit messages,
  code comments and JSDoc, docs, ADRs, OpenSpec proposals, task descriptions, review notes, replies to reviewers.
  Use when drafting, rewriting, or shortening any of these, or when asked to describe a change or summarise a
  diff. Not for UI strings or error messages.
---

# Writing contract

This contract wins over any tool-level or personal writing skill where they disagree.

## Where text belongs

| Text              | Goes to                                                                                | Shape                                                 |
| ----------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| PR description    | `.github/<slug>.pr.md`, filled into the sections of `.github/PULL_REQUEST_TEMPLATE.md` | The WHY. Never a restatement of the diff              |
| Commit message    | Conventional-commit subject: `type(scope): description`                                | A body only when the WHY does not fit the subject     |
| Design rationale  | `openspec/changes/<id>/proposal.md`                                                    | Alternatives and the trade-off                        |
| Task or follow-up | `.github/<slug>.task.md`                                                               | Context, Problem, Why to solve, Potential solution    |
| Code comment      | Next to the code                                                                       | One line, the non-obvious WHY                         |
| Reply to a person | A draft handed to the human                                                            | Never posted by an agent                              |

## Say it literally

Write for a reader who reads the words, not the culture behind them.

- No idioms, set phrases, or figures of speech. "The elephant in the room", "low-hanging fruit", "it has been a
  while", "at the end of the day", "moving forward". Say the literal thing.
- No metaphor or analogy as explanation. Describe the actual mechanism.
- No humour, slang, or references to a place, season, or custom.
- Do not use one word in two senses in the same text.
- Every "it", "this", and "that" points at one obvious noun. When it does not, repeat the noun.
- Say what happens or what to do, not what does not happen, unless the negative is the point.

Before: A paragraph surviving only because it "reads nicely" goes.
After: Good style is not a reason to keep a sentence.

## Use the established name

Names are the vocabulary a reader searches for. An invented synonym is a search miss.

- Reuse the name the codebase already has for a concept: the existing constant, type, function, or doc term.
  `NOT_FOUND` exists, so `NOT_SERVED` is not a new concept, it is a second name for the same one.
- Where the codebase has no name, take the one the domain or the platform uses: `fetch`, not `obtain`; `decode`,
  not `unpack`; the Solana term, not a paraphrase of it.
- One concept, one word, in code and prose alike. Do not rotate synonyms for variety.
- Coin a name only for a concept that has none, and put a one-line comment next to it saying what sets the
  concept apart from its nearest existing neighbour.

## Outlive the next change

Text stays in the repository after the code around it changes. Write what is still true after an unrelated
refactor.

- Explain the WHY, not the WHAT. The WHAT is the code, and the code changes without updating the comment.
- No words that date the text. Typical: "currently", "for now", "new", "legacy". State the condition instead:
  "until the RPC supports batch requests".
- Point at names, not positions. "The function above", "see below", "the previous section", or a line number
  break on the next edit. Name the symbol, heading, or file. Never a line number.
- Text that describes one moment (a review finding, task evidence) names the file and the commit it was read at:
  `path at <sha>`, or a permalink with a commit hash. The symbol inside the file, not its line, says where.
- In code, point at a symbol with `{@link}` so a rename follows it. In markdown, write a path as a relative link:
  a rename breaks it loudly.
- Do not describe another module's behaviour. State what this code requires of it, or enforce the requirement
  in a type, an assertion, or a test.
- Do not repeat a value the code owns: a default, a limit, a list of variants. Name the constant.
- A fact another system owns (a version, a dashboard, a vendor's flag list) gets a link to the source, not a copy.
- A link points at something that does not move: a symbol, a permalink with a commit hash, a canonical doc URL.
- A TODO carries a ticket, not a person or a date. Ticket status ("blocked on HOO-123") belongs in the ticket.

Test: is this sentence still true after the next unrelated change? If not, tie it to what it depends on, or
delete it.

Before: `// currently we retry 3 times because the RPC is flaky (see above)`
After: `// Public RPC drops requests under load; MAX_RPC_RETRIES caps the cost of a dead endpoint`

## Cut

- **Restating the heading.** A section called "Verifying" does not open with "This section explains how to verify."
- **Preamble.** "It's worth noting that", "Let's take a look at", "As mentioned above".
- **Closing summaries** that repeat what was just said. End on the last real point.
- **Prose restating a snippet, table, or signature** line by line.
- **Guidance for future choices, in a PR body or OpenSpec proposal.** Document the changes made and why. Policy is
  a separate document.

## Keep

- The non-obvious WHY, the failure mode, the consequence, the caveat.
- The specific thing: a name, an exact quote, a command, a measured result. Not "the config", "an error", "some tests".
- Uncertainty, stated plainly: "unverified", "I did not test this", "this is inference". Never build a section around
  an unverified claim. State the open question instead, and say what would settle it.
- Examples and cross-references. Cut prose, never evidence.

## Shape

- Lead with the conclusion, then the reason. The first sentence answers the question.
- One idea per sentence.
- State facts. No narrative.

## JSDoc

The contract in 1 to 3 lines. Never restate the signature. Keep `@example` blocks and `{@link}` references.

## Spelling

Spelling variant only, en-GB or en-US. This section says nothing about the shape or quality of nearby text.

- Editing a file: keep the variant the file already uses. Never respell existing prose.
- New file: use the variant of the repository's root docs (`AGENTS.md`, then `README.md`). Where they disagree or
  say nothing, en-US.
- Identifiers, quoted text, and proper nouns keep their source spelling.
