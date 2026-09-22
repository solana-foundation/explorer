---
name: writing
description: >-
  Read before producing ANY prose in this repository: docs, READMEs, OpenSpec
  proposals, PR and issue bodies, commit messages, task descriptions, plan
  files, review notes, code comments, replies to reviewers. The project's
  writing contract: terseness and size budgets, front-loaded answers, drafts never posted on a human's behalf.
---

# Writing contract

This file is the project's contract for generated text. It is discovered as a skill by Codex and Copilot from
`.agents/skills/`, by Claude Code through the `.claude/skills/writing` symlink, and referenced from `AGENTS.md`
for everything else. It wins over any tool-level or personal writing skill wherever they disagree.

## Where text belongs

| Text                    | Goes to                                                          | Shape                                              |
| ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| PR description         | `.github/PULL_REQUEST_TEMPLATE.md` sections                      | The WHY. Never a restatement of the diff            |
| Commit message          | Conventional-commit subject: `type(scope): description`          | A body only when the WHY does not fit the subject  |
| Design rationale        | `openspec/changes/<id>/proposal.md`                              | Alternatives and the trade-off                     |
| Task or follow-up       | Linear, or `.tasks/<slug>.md` when Linear is unavailable         | TLDR first, then the template body                 |
| Plan                    | `.plans/<slug>.md`                                               | Steps with done-when conditions, progress appended |
| Review finding          | `.github/reviews/<branch>.review.md`                             | `file:line`, what is wrong, failure scenario       |
| Code comment            | Next to the code                                                 | One line, the non-obvious WHY                      |
| Reply to a person       | A draft handed to the human                                      | About 200 words. Never posted by an agent          |

## Terseness

Default to the shortest text carrying the full meaning. Length is not the target. Density is.

### Cut

- **Restating the heading.** A section called "Verifying" does not open with "This section explains how to verify."
- **Preamble.** "It's worth noting that", "Let's take a look at", "As mentioned above", "In order to".
- **Doubled phrasing.** One verb, not three. "reviewed, re-created, and reasoned about" becomes "reviewed".
- **Padded qualifiers.** "quite", "very", "really", "actually", "basically", "simply", "just", "essentially".
- **Cliché and marketing register.** "seamless", "robust", "powerful", "leverage", "delve", "dive into", "at scale".
- **Narrating the writing.** "First I'll explain X, then Y." Write X, then Y.
- **Closing summaries** that repeat what was just said. End on the last real point.
- **Prose restating a snippet, table, or signature** line by line.
- **Sub-headings holding one sentence.** Fold it into the parent.

### Belongs elsewhere

Not filler, but not this document's job:

- **State owned by another system.** A dashboard snapshot, a vendor's CLI surface, a vendor's permission table.
  It rots, and you do not control it. Link to the source.
- **Policy, in a record of decisions.** Document the changes made and why. Guidance for future choices is a separate
  document.
- **The document describing itself.** "Why X is configured the way it is" as an opening line. The headings say it.

### Keep

- The non-obvious WHY, the failure mode, the consequence, the caveat.
- Concrete nouns, numbers, file paths, exact quotes, commands.
- Uncertainty, stated plainly: "unverified", "I did not test this", "this is inference". Never build a section around
  an unverified claim. State the open question instead, and say what would settle it.
- Examples and cross-references. Terseness trims prose, never evidence.

### Shape

- One idea per sentence. Prefer a full stop to a comma splice.
- Lead with the conclusion, then the reason. Never build up to it.
- **Order sections by when the reader needs them.** What to configure, then what to do when it breaks, then why any
  of it works. Mechanism last.
- **Headings name the obligation, not the topic.** "Rules to configure" beats "Rules". "Under attack" beats
  "Responding to a spike".
- Prefer a table or list whenever the content is a set of parallel items.
- Active voice, present tense.
- No narrative or emotional register. Reference material, not a story.

### Size

Budgets for comprehension, not quotas. Exceed one only when the content needs it.

| Unit          | Budget                                                             |
| ------------- | ------------------------------------------------------------------ |
| Sentence      | 25 words or fewer, averaging about 15                              |
| Paragraph     | 4 sentences or fewer, one idea                                     |
| Run of prose  | 150 words or fewer before a heading, table, list, or code block    |
| Bullet        | 1 line, 2 wrapped at most                                          |
| List          | 7 items or fewer. Beyond that, group it or make it a table         |
| Reply         | About 200 words, unless reporting findings or asked for depth      |
| Markdown file | About 250 lines. Past that, split or move reference material out   |

- **Front-load.** The first sentence answers the question. Everything after is support.
- Prefer a table to any list of three or more parallel attributes.
- A section needing more than its budget is usually two sections.

### Test before sending

Delete every sentence whose removal loses no information the reader needs. A paragraph surviving only because it
"reads nicely" goes.

Being asked to "make it shorter" means this rule was already broken.

## Replies to people

- A reply to a PR review thread, an issue comment, or a chat message stays around 200 words.
- **Agents draft, humans send.** Never post a reply on a person's behalf. Hand the draft over and stop.

## Code comments

- One line, carrying only the non-obvious WHY. Readers can grep for the what.
- JSDoc on public API: the contract in 1 to 3 lines. Never restate the signature. Keep `@example` blocks and
  `{@link}` references.

## Spelling

Match the spelling convention of the file you are editing. Never respell existing prose as a drive-by.

Always spelled as the source spells them: identifiers, APIs, config keys, CLI flags, package names, file paths,
quoted text, error strings, log output, proper nouns, and product names. `serialize()` stays `serialize()`.

## Punctuation

- **Ranges:** en dash, no spaces: `10–20`, `2026–2027`.
- **Oxford comma:** always. `paths, commands, and identifiers`.
- **Quotes:** straight `'` and `"`, never curly. Punctuation goes outside the closing quote unless it belongs to the
  quoted material.
- **No exclamation marks** in technical text.
- **Lists:** no terminal full stops on fragments. Full stops on complete sentences. Consistent within one list.
- **Numbers:** spell out one to nine in prose, numerals from 10. Always numerals with units, versions, and counts of
  things being measured.

## Formatting

- Wrap markdown prose at 120 columns unless the project's formatter says otherwise.
- Bold for in-text emphasis only. Italic is acceptable for bullet labels. Never bold whole sentences.
- Backticks for anything typed literally: paths, commands, identifiers, header names, env vars.
- Reference code as `file_path:line_number`.
