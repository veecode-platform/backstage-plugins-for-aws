# Fork Changelog

Journal of fork-side changes (features, fixes, infra) made on top of
upstream `awslabs/backstage-plugins-for-aws`. Append-only,
reverse-chronological (newest entry on top).

This file is the **journal** ("what we did, when"). For the **current
state** of divergence, see `FORK_CHANGES.md`. For the **merge history**
with upstream, see `FORK_MERGES.md`. Plugin-level changes are not
recorded in per-plugin `CHANGELOG.md` files — those are Lerna-owned and
would conflict on every upstream release.

Entry format:

```pre
## YYYY-MM-DD — <short title>

<one-paragraph summary, or bullet list of concrete changes>

Refs: FORK_CHANGES.md #N, commits <sha>..<sha>
```

---

<!-- New entries go above this line. -->

## 2026-05-22 — OCI build flow improvements

Three related changes that came out of testing `make package-oci`
end-to-end against the fork's primary deliverable:

- **Single-source the OCI image version.** `Makefile` now reads `VERSION`
  from root `package.json` via `jq` instead of the previously hardcoded
  `0.1.0`. Bump the root `package.json` to cut a release.
- **Auto-sync `dynamic-plugins-oci.yaml`.** After a successful
  `make package-oci`, the Makefile rewrites `:<tag>` in every
  `oci://...!<plugin>` reference so DevPortal pulls the image that was
  just built. Eliminates 12 hand edits per bump.
- **Fix `.dockerignore` for `agent-langgraph`.** The un-ignore list
  covered `*/frontend/dist-dynamic`, `*/backend/dist-dynamic`, and
  `core/catalog-config/dist-dynamic`, but missed
  `plugins/genai/agent-langgraph/dist-dynamic` (a `backend-plugin-module`
  living outside those patterns). BuildKit was excluding it from the
  context, breaking the COPY in `Containerfile.dynamic`. Added the
  matching negation pattern.

Refs: FORK_CHANGES.md #13 (OCI Image Packaging); commits `38c0873`,
`1a71054`, `b8ac31d`.

## 2026-05-22 — Add FORK_ROADMAP.md (dynamic-plugin backlog)

Introduced `FORK_ROADMAP.md` as a fifth fork-bookkeeping file: backlog of
work not yet done plus parked decisions. Seeded with the dynamic-plugin /
OCI coverage inventory — Ready (ECS, ECR, Cost Insights, Security Hub,
GenAI + agent-langgraph, catalog-config) and TODO (CodePipeline,
CodeBuild, scaffolder-actions). Added `FORK_ROADMAP.md merge=ours` to
`.gitattributes` and referenced the new file from `CLAUDE.md`'s
fork-maintenance section.

No code-level changes; the three TODO items will be implemented in
separate sessions.

Refs: FORK_ROADMAP.md (new), FORK_CHANGES.md #8 (related).

## 2026-05-22 — Fork maintenance infrastructure + first upstream merge

Two changes in one window:

- **Fork maintenance infrastructure** (commit `65fd61a`): introduced the
  four-file scheme (`FORK_CHANGES.md`, `FORK_CHANGELOG.md`,
  `FORK_MERGES.md`, `FORK_PLAN.md`); added `.gitattributes` with
  `merge=ours` for `yarn.lock` and all fork-only files; added
  `scripts/merge-upstream.sh`, the `merge-upstream` Claude skill, and a
  weekly `.github/workflows/upstream-divergence.yml` report.
- **First upstream merge since fork** (merge commit `63b60aa`, journal
  commit `c268d6e`): absorbed 24 upstream commits in range
  `1b0c194..7b8aa4a`. Adopted upstream PR #560's `@backstage/backend-common`
  removal across all `package.json` files; accepted upstream's cleaner
  `securityhub/backend` TS implementation (which also migrated
  `catalogApi: CatalogApi` → `CatalogService` from
  `@backstage/plugin-catalog-node`); absorbed upstream PR #580's ECR
  config-key fix (`maxImages` → `aws.ecr.maxImages`). Retired
  `FORK_CHANGES.md` item #9. Deferred adopting upstream's new
  `@backstage/ui` dep in `packages/app/package.json` to a future round.

Refs: FORK_CHANGES.md #9 (retired); FORK_MERGES.md 2026-05-22 entry;
commits `65fd61a`, `63b60aa`, `c268d6e`.

## 2026-03-12 — Dynamic plugin support for catalog-config module

Added `export-dynamic` script and `@red-hat-developer-hub/cli` devDep to
`plugins/core/catalog-config`. Embeds `@aws/aws-core-plugin-for-backstage-common`
in the dynamic bundle. Host distro must provide
`@backstage/plugin-catalog-backend-module-incremental-ingestion`.

Refs: FORK_CHANGES.md #12, commit `284e080`.

## 2026-03-11 — Security Hub and GenAI dynamic plugin readiness

Series of changes to make securityhub and genai loadable as dynamic
plugins in Red Hat Developer Hub / DevPortal:

- Removed `@backstage/backend-common` from securityhub backend — used
  `auth`/`httpAuth` from `@backstage/backend-plugin-api` directly.
  `@backstage/backend-common` cannot load inside dynamic plugins.
- Converted `@langchain/langgraph-checkpoint-sqlite` from static
  import to dynamic `import()` in `LangGraphReactAgentType.ts` so the
  native `better-sqlite3` module is only loaded when configured. This
  lets us use `--suppress-native-package` in the dynamic export.
- Changed GenAI backend's self-referencing `package.json` import in
  `McpService.ts` to a relative path (dynamic export renames the
  package with a `-dynamic` suffix, breaking the self-reference).
- Added securityhub example annotation, cost-insights config, and a
  `better-sqlite3` Yarn resolution to keep deps consistent.
- Wired the security-hub GenAI agent with the correct config schema.

Refs: FORK_CHANGES.md #9, #10, #11, commits `fcfb8ab`, `a05c44a`,
`3d8455b`, `fe43bbd`, `45780db`, `f0bdf4a`.

## 2026-03-10 — OCI image packaging and cost-insights dynamic support

Added container-image distribution for dynamic plugins as an
alternative to npm publishing:

- `Containerfile.dynamic` builds a `FROM scratch` image bundling each
  plugin's `dist-dynamic/` output into a named directory.
- `Makefile` targets `package-oci` / `publish-oci`.
- `docker-compose-oci.yaml` and `dynamic-plugins-oci.yaml` for local
  testing against an OCI registry.
- `.dockerignore` updated with negation patterns to allow
  `dist-dynamic/` directories into the build context.
- Cost-insights frontend and backend gained `export-dynamic` scripts.
- Intermediate revert: tried publishing dynamics to OCI exclusively,
  reverted to keep npm registry as the primary publish target with
  OCI as an additional option.

Refs: FORK_CHANGES.md #8, #13, commits `74f16f7`, `7c90e44`, `5bee6be`,
`6feeddd`, `f48bc55`, `08da6f0`.

## 2026-03-09 — ECS / ECR dynamic plugin support

First plugins enabled for dynamic loading. Added `export-dynamic`
script + `@red-hat-developer-hub/cli` devDep and `dist-dynamic/`
gitignores to `plugins/ecs/{frontend,backend}` and
`plugins/ecr/{frontend,backend}`. Added the workspace exclusion
`!plugins/**/dist-dynamic/**` to root `package.json` so Yarn doesn't
discover `package.json` files inside the embedded bundles.

Refs: FORK_CHANGES.md #7, #8, commits `532d5fe`, `6feeddd`.

## 2026-03-09 — Bootstrap fork (Backstage 1.48.4 upgrade)

Initial divergence from upstream `1b0c194`. Upstream was on Backstage
1.43.1; bumped the monorepo to 1.48.4 and fixed the breaking changes
that came with it:

- All `@backstage/*` dependencies bumped across root, app, backend,
  and every plugin. `yarn.lock` regenerated.
- Migrated four scaffolder actions (`s3/cp`, `cloudcontrol/create`,
  `codecommit/publish`, `eventbridge/eventbridge`) from the old
  `z.object({...})` schema to the `z => z.object({...})` function
  wrapper format required by Backstage ≥ 1.48.
- Fixed `scaffolderActionsExtensionPoint` import path —
  `/alpha` subpath was removed in newer versions and the old import
  returned `undefined`, causing a startup `TypeError`.
- Fixed `StreamEvent` import in `agent-langgraph` — the previous
  internal `dist/` path is not a public export in newer
  `@langchain/core` versions.
- Fixed a circular dependency in `resource-locator-factory.ts` by
  using direct file imports instead of importing from the barrel.
- Moved `@backstage/*` packages from `dependencies` to
  `peerDependencies` (+ `devDependencies`) in `plugins/core/common`
  and `plugins/core/node` to stop pinning Backstage versions on
  consumers.
- Added `CLAUDE.md` to guide future Claude Code sessions.

Refs: FORK_CHANGES.md #1, #2, #3, #4, #5, #6, commits `c81c0a4`,
`69a5271`, `4227042`.

---

## Row zero — fork point (do not edit)

Forked from upstream `1b0c194` (2026-02-07, "fix(deps): update
aws-sdk-js-v3 monorepo (#557)") on Backstage 1.43.1. State at row zero
is whatever upstream had at that commit; entries above describe
everything fork-side that came after.
