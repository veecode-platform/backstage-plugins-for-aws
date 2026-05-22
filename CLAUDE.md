# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a fork from the upstream repo at <https://github.com/awslabs/backstage-plugins-for-aws> . This fork adds support for Backstage v1.48.x (or superior), so it deals with breaking changes in the Backstage framework and updates dependencies accordingly. This results in eternal conflicts with the upstream repo.

## Fork maintenance strategy

Upstream `awslabs/backstage-plugins-for-aws` keeps moving (mostly dependency bumps, occasional fixes) and we keep modifying the same files (Backstage upgrade, dynamic-plugin support). Merges therefore conflict on every cycle. The strategy is to make those merges cheap and traceable rather than try to eliminate them.

Five `FORK_*.md` files at the repo root divide the bookkeeping into one job each. Two are **state** (rewritten as facts change), two are **journals** (append-only history), one is the **backlog**:

- @FORK_CHANGES.md (state) — what is different between fork and upstream **right now**, item by item, with merge guidance per item. Edit when an item is added or retired (e.g. upstream catches up to one of our fixes).
- @FORK_PLAN.md (state) — the plan and the recurring merge runbook. Edit only when the plan itself changes.
- @FORK_ROADMAP.md (backlog) — fork-side work that isn't yet done (e.g. plugins still missing a dynamic build) plus parked decisions. Edit when an item lands or a new item appears.
- @FORK_CHANGELOG.md (journal) — dated entries describing **fork-side** code changes. Append a new entry whenever fork-side code changes. Mirrors per-plugin `CHANGELOG.md` files in role, but kept centrally so we don't fight Lerna on every upstream release.
- @FORK_MERGES.md (journal) — one entry per `git merge upstream/main`, recording which upstream range we absorbed, how each conflict was resolved, and which `FORK_CHANGES.md` items the merge retired. Row zero (fork point `1b0c194`, 2026-02-07) is immutable and anchors the divergence range.

Together these answer three questions a future maintainer (or future Claude) will need: *what is different today* (`FORK_CHANGES.md`), *how did we get here* (`FORK_CHANGELOG.md` + `FORK_MERGES.md`), *how do we merge next* (`FORK_PLAN.md`).

### Per-plugin `CHANGELOG.md` files are off-limits

Do **not** edit any `plugins/**/CHANGELOG.md`. Lerna owns those and rewrites them on every upstream `chore(release): Publish` commit, so any fork edit becomes a guaranteed conflict with no upside (our consumers install via path/OCI, not npm). All fork-side change notes belong in `FORK_CHANGELOG.md`.

### Tooling that supports the strategy

- `.gitattributes` declares `merge=ours` for `yarn.lock` and all fork-only files (`FORK_*.md` including `FORK_ROADMAP.md`, `CLAUDE.md`, `Makefile`, `Containerfile.dynamic`, `docker-compose*.yaml`, `dynamic-plugins*.yaml`, `app-config.dynamic.yaml`, `OCI.md`, `registries.conf`, `.claude/**`). One-time local setup on a fresh clone: `git config merge.ours.driver true` (the merge script does this for you).
- `scripts/merge-upstream.sh` runs the merge end-to-end: fetch, list the upstream range since the last `FORK_MERGES.md` entry, merge (auto-resolving via `.gitattributes`), regenerate `yarn.lock`, and print a draft `FORK_MERGES.md` entry. Flags: `--dry-run`, `--report`.
- `.claude/skills/merge-upstream/SKILL.md` is the project skill that drives the script and walks through any remaining conflicts using the per-item guidance in `FORK_CHANGES.md`. Invoke it when the user asks to "merge upstream" or equivalent.
- `.github/workflows/upstream-divergence.yml` runs weekly (and on-demand) and posts a divergence report to a pinned issue labeled `upstream-divergence` — ahead/behind counts plus the commit list since the last recorded merge.

### When to update which file

| You did this | Update |
|---|---|
| Modified fork-side code | `FORK_CHANGELOG.md` (append entry); `FORK_CHANGES.md` (add/edit item if the divergence is durable) |
| Merged from upstream | `FORK_MERGES.md` (append entry); `FORK_CHANGES.md` (retire items upstream caught up to) |
| Changed the merge process itself | `FORK_PLAN.md` |
| Fixed a one-off bug with no divergence implications | Nothing in `FORK_*` files; commit message is enough |

## Project Overview

Monorepo of Backstage plugins that integrate with AWS services (ECS, ECR, CodePipeline, CodeBuild, Security Hub, Cost Insights, Generative AI). Published under the `@aws` npm scope. Uses Backstage framework v1.48.4.

## Build & Development Commands

```bash
yarn install                  # Install dependencies (Yarn 4 with PnP)
yarn build:all                # Build all packages
yarn tsc                      # TypeScript check (incremental)
yarn tsc:full                 # Full TypeScript check (no incremental, no skipLibCheck)
yarn start                    # Start local dev server (backstage-cli repo start)

# Linting
yarn lint                     # Lint changed files (since origin/main)
yarn lint:all                 # Lint all files
yarn prettier:check           # Check formatting

# Testing
yarn test                     # Run tests for @aws/* scoped packages only
yarn test:all                 # Run all tests with coverage
yarn test:e2e                 # Playwright e2e tests

# Single package commands (from root)
yarn workspace @aws/amazon-ecs-plugin-for-backstage-backend test
yarn workspace @aws/amazon-ecs-plugin-for-backstage-backend build
yarn workspace @aws/amazon-ecs-plugin-for-backstage-backend lint

# Or from within a package directory
cd plugins/ecs/backend && yarn test
```

## Architecture

### Workspace Structure

- **`packages/app`** — Backstage frontend app (for local dev/testing)
- **`packages/backend`** — Backstage backend app (for local dev/testing)
- **`plugins/core/`** — Shared libraries used by all AWS plugins:
  - `common` (`@aws/aws-core-plugin-for-backstage-common`) — Shared types/utilities (common-library role)
  - `node` (`@aws/aws-core-plugin-for-backstage-node`) — Backend/node utilities, AWS SDK helpers (node-library role)
  - `react` (`@aws/aws-core-plugin-for-backstage-react`) — Shared React components (web-library role)
  - `catalog-config` — Entity provider for ingesting AWS resources into Backstage catalog
  - `scaffolder-actions` — Custom scaffolder actions for AWS services
- **`plugins/<service>/`** — Each AWS service plugin follows a three-package pattern:
  - `frontend` — Frontend plugin (role: `frontend-plugin`)
  - `backend` — Backend plugin (role: `backend-plugin`)
  - `common` — Shared types/API definitions (role: `common-library`)

### Package Naming Convention

- Frontend: `@aws/<service>-plugin-for-backstage` (e.g., `@aws/amazon-ecs-plugin-for-backstage`)
- Backend: `@aws/<service>-plugin-for-backstage-backend`
- Common: `@aws/<service>-plugin-for-backstage-common`

### Key Patterns

- All packages use `backstage-cli` for build/test/lint (`backstage-cli package build`, etc.)
- Internal workspace dependencies use `workspace:^` protocol
- AWS SDK v3 clients are used throughout
- Backend tests use `aws-sdk-client-mock` for mocking AWS SDK calls and `supertest` for API testing
- Frontend tests use `@testing-library/react` and `msw` for mocking
- Lerna manages versioning with independent mode and conventional commits
- Prettier config extends `@spotify/prettier-config`
- Node 20 or 22 required (see `mise.toml` for tool versions)
- License: Apache-2.0 (all source files must include license header)

### Releases

Lerna handles versioning with conventional commits. Versions are independent per package. Releases are created on GitHub from the `main` branch.
