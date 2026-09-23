---
name: writing
description: >-
  Read before producing ANY prose in this repository: docs, READMEs, OpenSpec
  proposals, PR and issue bodies, commit messages, task descriptions, plan
  files, review notes, code comments, replies to reviewers. The project's
  writing contract: where each text belongs, what to cut, literal language,
  drafts never posted on a human's behalf.
---

# Writing contract

This file is the project's contract for generated text. It is discovered as a skill by Codex and Copilot from
`.agents/skills/`, by Claude Code through the `.claude/skills/writing` symlink, and referenced from `AGENTS.md`
for everything else. It wins over any tool-level or personal writing skill wherever they disagree.

## Where text belongs

| Text              | Goes to                                                          | Shape                                              |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| PR description    | `.github/PULL_REQUEST_TEMPLATE.md` sections                      | The WHY. Never a restatement of the diff           |
| Commit message    | Conventional-commit subject: `type(scope): description`          | A body only when the WHY does not fit the subject  |
| Design rationale  | `openspec/changes/<id>/proposal.md`                              | Alternatives and the trade-off                     |
| Task or follow-up | Linear, or `.tasks/<slug>.md` when Linear is unavailable         | TLDR first, then the template body                 |
| Plan              | `.plans/<slug>.md`                                               | Steps with done-when conditions, progress appended |
| Review finding    | `.github/reviews/<branch>.review.md`                             | `file:line`, what is wrong, failure scenario       |
| Code comment      | Next to the code                                                 | One line, the non-obvious WHY                      |
| Reply to a person | A draft handed to the human                                      | About 200 words. Never posted by an agent          |

## Say it literally

Write for a reader who reads the words, not the culture behind them.

- No idioms, set phrases, or figures of speech. "The elephant in the room", "low-hanging fruit", "it has been a
  while", "at the end of the day", "moving forward". Say the literal thing.
- No metaphor or analogy as explanation. Describe the actual mechanism.
- No humour, slang, or references to a place, season, or custom.
- One meaning per word in a sentence. Where a common word has a figurative and a literal sense, use the literal one.
- Every "it", "this", and "that" points at one obvious noun. When it does not, repeat the noun.
- Say what happens or what to do, not what does not happen, unless the negative is the point.

Before: A paragraph surviving only because it "reads nicely" goes.
After: Good style is not a reason to keep a sentence.

## Outlive the next change

Text lives longer than the code around it. Write what stays true after an unrelated refactor.

- Explain the WHY, not the WHAT. The WHAT is the code, and the code changes without updating the comment.
- No words that describe the moment of writing: "currently", "now", "new", "legacy", "temporary", "for now".
  State the condition instead: "until the RPC supports batch requests".
- Point at names, not positions. "The function above", "see below", "the previous section", or a line number
  break on the next edit. Name the symbol, heading, or file.
- In code, point at a symbol with `{@link}` so a rename follows it. In markdown, write a path as a relative link so
  a checker can fail on it. A bare path in a comment is checked by nobody.
- Do not describe another module's behaviour. State what this code requires of it, or enforce the requirement
  in a type, an assertion, or a test.
- Do not repeat a value the code owns: a default, a limit, a list of variants. Name the constant.
- A fact another system owns (a version, a dashboard, a vendor's flag list) gets a link to the source, not a copy.
- A link points at something that does not move: a symbol, a permalink with a commit hash, a canonical doc URL.
  Never a branch-relative line link.
- A TODO carries a ticket, not a person or a date. Ticket status ("blocked on HOO-123") belongs in the ticket.

Test: would this sentence still be true after the next unrelated change? If not, tie it to what it depends on,
or delete it.

Before: `// currently we retry 3 times because the RPC is flaky (see above)`
After: `// Public RPC drops requests under load; MAX_RPC_RETRIES bounds the cost of a dead endpoint`

## Cut

- **Restating the heading.** A section called "Verifying" does not open with "This section explains how to verify."
- **Preamble.** "It's worth noting that", "Let's take a look at", "As mentioned above".
- **Closing summaries** that repeat what was just said. End on the last real point.
- **Prose restating a snippet, table, or signature** line by line.
- **Guidance for future choices, in a record of decisions.** Document the changes made and why. Policy is a separate
  document.

## Keep

- The non-obvious WHY, the failure mode, the consequence, the caveat.
- The specific thing: a name, an exact quote, a command, a measured result. Not "the config", "an error", "some tests".
- Uncertainty, stated plainly: "unverified", "I did not test this", "this is inference". Never build a section around
  an unverified claim. State the open question instead, and say what would settle it.
- Examples and cross-references. Terseness trims prose, never evidence.

## Shape

- Lead with the conclusion, then the reason. The first sentence answers the question.
- One idea per sentence.
- Active voice, present tense.
- Reference material, not a story.
- A reply to a person stays around 200 words. A markdown file stays around 250 lines. Past that, split it.

## Replies to people

- **Agents draft, humans send.** Never post a reply on a person's behalf. Hand the draft over and stop.

## Code comments

- One line, carrying only the non-obvious WHY. Readers can grep for the what.
- JSDoc on public API: the contract in 1 to 3 lines. Never restate the signature. Keep `@example` blocks and
  `{@link}` references.

## Spelling

Match the spelling convention of the file you are editing. Identifiers, quoted text, and proper nouns keep their
source spelling.
