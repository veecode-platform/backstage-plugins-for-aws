---
name: merge-upstream
description: Merge awslabs/backstage-plugins-for-aws upstream into the fork. Use when the user asks to "merge upstream", "pull from upstream", "catch up with upstream", "rebase on upstream", or otherwise wants to absorb new upstream commits. Drives scripts/merge-upstream.sh, guides through any remaining conflicts using FORK_CHANGES.md, and writes the FORK_MERGES.md and FORK_CHANGELOG.md entries.
---

# Merge upstream

You are merging upstream `awslabs/backstage-plugins-for-aws` into this
fork. The recurring runbook is in `FORK_PLAN.md`; this skill executes it
end to end.

## When to use

The user says one of: "merge upstream", "catch up with upstream", "pull
upstream changes", "run the merge", or anything that means absorbing new
upstream commits. Do not invoke for one-off cherry-picks — for those use
`git cherry-pick` directly.

## Preconditions, verified before starting

1. Working tree is clean: `git status --porcelain` returns empty.
2. `upstream` remote exists: `git remote get-url upstream`.
3. We are on a branch the user wants to merge into (usually `main`). If
   we are on `main`, confirm with the user before merging — some teams
   prefer a feature branch like `merge/upstream-YYYY-MM-DD`.

If any precondition fails, stop and tell the user.

## Procedure

### 1. Survey what is being absorbed

```bash
git fetch upstream
```

Read the last "Upstream tip merged" from `FORK_MERGES.md` (or fall back
to the fork point `1b0c194`). Show the user:

- `git log --oneline <last-tip>..upstream/main` — the commit list.
- `git diff --stat <last-tip>..upstream/main` — file change summary.
- For each upstream commit whose subject hints at overlap with an open
  `FORK_CHANGES.md` item (e.g. mentions `backend-common`, `zod`,
  `scaffolder`, files we modified), call it out as **likely conflict**.

Ask the user to confirm before merging.

### 2. Run the merge

```bash
scripts/merge-upstream.sh
```

The script auto-resolves `yarn.lock` and fork-only files via
`.gitattributes` `merge=ours`, runs `yarn install` to regenerate the
lock against merged manifests, and amends that into the merge commit.

If the script exits non-zero, conflicts remain — proceed to step 3.
If it exits clean, skip to step 4.

### 3. Resolve remaining conflicts

For each conflicting file, decide ours / upstream / manual:

| Cue | Decision |
|---|---|
| File listed in `FORK_CHANGES.md` and upstream's change implements the same intent | **upstream** — retire the `FORK_CHANGES.md` item |
| File listed in `FORK_CHANGES.md` and upstream's change is different | **manual** — merge both intents |
| File not in `FORK_CHANGES.md` and we never touched it | **upstream** (should not have conflicted; investigate) |
| `package.json` with `@backstage/*` version conflict | **ours** (we run a newer Backstage) |

Edit, then `git add <file>`. Repeat until clean.

After resolving, run:

```bash
yarn install
yarn tsc
yarn test
```

If any of these break, fix and commit. Do not finalize the merge with a
broken type-check or test suite.

Finalize the merge commit:

```bash
git commit --no-edit
```

### 4. Update the journal files

Run:

```bash
scripts/merge-upstream.sh --report
```

This prints a draft `FORK_MERGES.md` entry. Fill in the blanks:

- **FORK_CHANGES entries retired** — list every fork item upstream
  caught up to in this merge.
- **FORK_CHANGES entries added** — list any new fork items added during
  conflict resolution.
- **Post-merge checks** — paste actual status (e.g. `tsc clean, 47
  tests passing`).
- **Notes** — anything future-you needs to know (e.g. "had to bump
  langchain-core resolution to keep dynamic export working").

Paste the entry into `FORK_MERGES.md` **above** the previous newest
entry (above the `<!-- New entries go above this line. -->` marker).

If fork-side code changed during conflict resolution, append an entry to
`FORK_CHANGELOG.md` in the same format already used there.

Edit `FORK_CHANGES.md` to remove retired items and add new ones.

### 5. Confirm with the user

Show the user:

- The merge commit SHA and message.
- The diff stats of journal updates.
- Test/typecheck status.

Wait for explicit approval before any `git push`. Pushing publishes the
merge to `origin/main`, which is a shared-state action.

## Failure modes to watch for

- **`yarn.lock` did not regenerate cleanly.** Usually means upstream
  added a dep that conflicts with our Backstage version. Investigate
  the failing resolution before forcing it.
- **`tsc` breaks after merge.** Usually a Backstage API change. Compare
  the relevant upstream commit; if it is a feature we don't need yet,
  the right fix may be to revert the upstream change in our tree and
  add a new `FORK_CHANGES.md` item documenting why.
- **A conflict appears in a file not in `FORK_CHANGES.md`.** Don't
  blindly resolve. Find out which fork commit introduced our version
  (`git log --oneline <path>`) and either add a `FORK_CHANGES.md` item
  for it or accept upstream's version. Silently keeping unrecorded
  divergence is the failure mode this whole system exists to prevent.

## Output style

Keep status messages terse. The script already prints colored progress;
your job is to summarize and decide, not to re-narrate the script.

End-of-merge summary should be at most six lines: commit SHA, range
absorbed, conflicts resolved (count), retired/added FORK_CHANGES items,
tsc/test status, push-or-not next step.
