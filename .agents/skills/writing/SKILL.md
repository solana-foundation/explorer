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

## Outlive the next change

Text stays in the repository after the code around it changes. Write what is still true after an unrelated
refactor.

- Explain the WHY, not the WHAT. The WHAT is the code, and the code changes without updating the comment.
- No words that date the text. Typical: "currently", "for now", "new", "legacy". State the condition instead:
  "until the RPC supports batch requests".
- Point at names, not positions. "The function above", "see below", "the previous section", or a line number
  break on the next edit. Name the symbol, heading, or file.
- In code, point at a symbol with `{@link}` so a rename follows it. In markdown, write a path as a relative link:
  a rename breaks it loudly. A line-number link breaks silently. Never use one.
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

Match the spelling convention of the file you are editing. In a new file, match its nearest neighbour. Identifiers,
quoted text, and proper nouns keep their source spelling.
