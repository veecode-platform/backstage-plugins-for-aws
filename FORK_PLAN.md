# Fork Maintenance Plan

How we keep this fork sustainable across upstream merges. Split into setup
work (one-time) and a per-merge runbook (recurring).

The fork exists to ship the **OCI image**
(`quay.io/veecode/backstage-aws-dynamic-plugins`) to VeeCode DevPortal —
every other concern here (merges, conflict policy, lock-file strategy)
serves keeping that image buildable and current. See `CLAUDE.md` →
*Primary objective*.

Related files:

- `FORK_CHANGES.md` — current state of divergence (reference).
- `FORK_ROADMAP.md` — backlog (plugins not yet in the OCI image, etc.).
- `FORK_CHANGELOG.md` — journal of fork-side changes (append-only).
- `FORK_MERGES.md` — log of upstream→fork merges (append-only).

---

## Phase 1 — One-time setup

These tasks each fit in a single session. Order is not strict, but later
items assume earlier ones exist.

### Task 1.1 — `yarn.lock` merge strategy

**Goal:** stop hand-resolving `yarn.lock` conflicts.

- Add `.gitattributes` entry: `yarn.lock merge=ours`.
- Document in `FORK_PLAN.md` runbook: after every merge, run
  `yarn install` to regenerate the lock against the merged manifests.
- Acceptance: a merge that touches `yarn.lock` on both sides resolves
  with no manual edits; `yarn install` produces a clean tree.

**Estimated effort:** 15 min. Single session.

### Task 1.2 — `merge-upstream` script + project skill

**Goal:** one-command upstream merge with documented conflict policy.

Files to create:

- `scripts/merge-upstream.sh` — fetches upstream, merges, auto-resolves
  the files we always resolve the same way, lists remaining conflicts
  and prints next steps. Idempotent and re-runnable.
- `.claude/skills/merge-upstream/SKILL.md` — project skill that
  invokes the script, then guides the user through remaining conflicts
  using the conflict-resolution table in `FORK_CHANGES.md`. Posts a
  draft `FORK_MERGES.md` entry at the end.

Conflict policy the script encodes (auto-resolve, do not prompt):

| Path | Strategy |
|---|---|
| `yarn.lock` | ours (regenerate after) |
| `CLAUDE.md`, `FORK_*.md`, `Makefile`, `Containerfile.dynamic`, `docker-compose*.yaml`, `dynamic-plugins*.yaml`, `app-config.dynamic.yaml`, `OCI.md`, `registries.conf` | ours |
| `.claude/**` | ours |

Everything else falls through to manual resolution.

**Acceptance:** running the skill on a fresh `upstream/main` produces a
clean merge or a clearly-listed set of remaining conflicts plus a draft
merge log entry.

**Estimated effort:** 1–2 hours. Single session.

### Task 1.3 — CI job: upstream divergence report

**Goal:** weekly signal so divergence doesn't silently grow.

- GitHub Action under `.github/workflows/upstream-divergence.yml`.
- Triggers: `schedule` (weekly) + `workflow_dispatch`.
- Steps: fetch upstream, compute `git rev-list --count
  upstream/main..main` and `..upstream/main`, list new upstream commits
  since `FORK_MERGES.md`'s last entry, summarize per-file change
  stats. Output as a GitHub Issue (or update an existing pinned one).

**Acceptance:** issue updates weekly with: N commits behind, N ahead,
list of upstream commits since last merge, list of changed files.

**Estimated effort:** 1 hour. Single session. Depends on 1.4.

### Task 1.4 — `FORK_MERGES.md` and `FORK_CHANGELOG.md` skeletons

**Goal:** start the journals so 1.3 has somewhere to anchor.

- `FORK_MERGES.md` — table of merges (see schema below). Seed with the
  fork point as row zero.
- `FORK_CHANGELOG.md` — reverse-chronological journal of fork-side
  changes. Seed with current `FORK_CHANGES.md` items as the initial
  entry dated at the fork point.

`FORK_MERGES.md` schema (one row per merge, newest first):

```pre
## YYYY-MM-DD — <our merge commit short SHA>

- Upstream tip merged: <upstream short SHA> ("<commit subject>")
- Range absorbed: <prev upstream tip>..<new upstream tip> (N commits)
- Conflicts resolved:
  - <path>: <ours|upstream|manual — one line why>
- FORK_CHANGES entries retired: #N, #M (upstream caught up)
- New FORK_CHANGES entries added: #X (link)
- Post-merge actions: yarn install, yarn tsc, yarn test (status)
```

The fork point (`1b0c194`, 2026-03-09) is row zero — never edited.

**Acceptance:** both files exist with the seed content; documented in
`CLAUDE.md` so future Claude sessions know to update them.

**Estimated effort:** 30 min. Single session.

### Task 1.5 — Plugin CHANGELOG policy

**Goal:** decide and document so we stop debating it.

**Decision:** do not edit `plugins/**/CHANGELOG.md`. Those are
Lerna-owned and conflict on every upstream release. All fork-side
changes go to root `FORK_CHANGELOG.md`.

**Acceptance:** policy stated in `CLAUDE.md` and `FORK_PLAN.md`. No
fork commits modify per-plugin CHANGELOGs.

**Estimated effort:** 10 min. Roll into Task 1.4.

---

## Phase 2 — Pending upstream merge

This is the first real exercise of the runbook below. Do not start
until Phase 1 is done — otherwise we re-do the same work next time.

### Task 2.1 — Merge `upstream/main` (current tip)

Current upstream tip when this plan was written: see
`FORK_MERGES.md` divergence section. 24 commits, ~2 substantive
conflicts expected:

- `plugins/securityhub/backend/**` — accept upstream (#560 supersedes
  fork item #9). Retire `FORK_CHANGES.md` item #9.
- `plugins/ecr/backend/src/config/config.ts` — accept upstream (#580
  bug fix we want).

Everything else: dependency bumps against upstream's older Backstage
line, absorbed by regenerating `yarn.lock`.

**Acceptance:**

- `yarn install && yarn tsc && yarn test` clean.
- `FORK_CHANGES.md` updated (item #9 removed).
- `FORK_MERGES.md` entry added.
- `FORK_CHANGELOG.md` entry added.

**Estimated effort:** 1–2 hours. Single session.

---

## Recurring runbook — every upstream merge

This is what each future merge session looks like. The skill from
Task 1.2 automates steps 1–4.

1. `git fetch upstream`
2. Inspect upstream commits in range `<last merge tip>..upstream/main`
   (from `FORK_MERGES.md`). Note any commits that overlap with open
   `FORK_CHANGES.md` items.
3. `git merge upstream/main`. Auto-resolve per the conflict policy in
   Task 1.2.
4. `yarn install` (regenerates lock).
5. For each remaining conflict, decide ours/upstream/manual using
   `FORK_CHANGES.md` guidance per item.
6. `yarn tsc && yarn test`. Fix breakage.
7. Update `FORK_CHANGES.md`: remove items upstream caught up to, add
   items if we made new fork-side adjustments during the merge.
8. Append entry to `FORK_MERGES.md` (use schema above).
9. Append entry to `FORK_CHANGELOG.md` if fork-side code changed
   during the merge.
10. Commit and push.

The skill in Task 1.2 should walk through this and pre-fill steps
8–9 from the merge state.

---

## Out of scope (for now)

User decided to defer these — listed here so future sessions don't
reopen the debate without a reason:

- Upstreaming fork bug fixes (zod migration, scaffolder import,
  langchain import, circular dep, peerDependencies). Possible later
  win but not now.
- Restructuring `export-dynamic` scripts out of per-plugin
  `package.json` files. RHDH-CLI conflicts are known and tolerated.
- CodeGraph installation. Marginal value at current codebase size.

---

## File ownership at a glance

| File | Edited by | When |
|---|---|---|
| `FORK_CHANGES.md` | Humans / Claude | When divergence state changes |
| `FORK_CHANGELOG.md` | Humans / Claude | When fork-side code changes |
| `FORK_MERGES.md` | Humans / Claude (via skill) | Every upstream merge |
| `FORK_PLAN.md` | Humans | When plan itself evolves |
| `plugins/**/CHANGELOG.md` | Upstream / Lerna only | Never edited by us |
