# Fork Changes

This document describes the changes made in this fork
(`veecode-platform/backstage-plugins-for-aws`) relative to the upstream
repository (`awslabs/backstage-plugins-for-aws`). Its purpose is to guide
future upstream merges so that fork-specific changes are preserved.

## Upstream

- **Repository:** `https://github.com/awslabs/backstage-plugins-for-aws`
- **Remote name:** `upstream`
- **Fork diverged from upstream at:** commit `1b0c194` (2026-03-09)

## Summary of Fork Changes

### 1. Backstage Version Upgrade (1.43.1 -> 1.48.4)

All `@backstage/*` dependency versions were bumped across the monorepo to
align with Backstage release 1.48.4. This is ahead of upstream which is
still on 1.43.1.

**Affected files:**

- `backstage.json` — version field changed to `1.48.4`
- `package.json` — root devDependencies (`@backstage/cli`, etc.)
- `packages/app/package.json`
- `packages/backend/package.json`
- All `plugins/**/package.json` (every backend, common, and frontend package)
- `yarn.lock` — regenerated for the new dependency versions

**Merge guidance:** When upstream bumps Backstage versions, compare their
target version with ours. If upstream catches up to or surpasses 1.48.4,
accept upstream's versions. If upstream is still behind, keep ours and
resolve `yarn.lock` conflicts by running `yarn install` after merging
`package.json` files.

### 2. Scaffolder Actions — Zod Schema Migration

The four scaffolder actions used the **old schema builder format**
(`field: z => z.type()`), which is incompatible with Backstage >= 1.48.
They were migrated to the **new `z.object()` format**.

**Affected files:**

- `plugins/core/scaffolder-actions/src/actions/s3/cp.ts`
- `plugins/core/scaffolder-actions/src/actions/cloudcontrol/create.ts`
- `plugins/core/scaffolder-actions/src/actions/codecommit/publish.ts`
- `plugins/core/scaffolder-actions/src/actions/eventbridge/eventbridge.ts`

**What changed in each file:**

- Added `import { z } from 'zod'` (explicit import instead of builder parameter)
- Changed `input: { field: z => z.string()... }` to `input: z.object({ field: z.string()... })`
- Changed `output: { field: z => z.string()... }` to `output: z.object({ field: z.string()... })`
- No handler logic was modified

**Merge guidance:** If upstream migrates these schemas themselves, accept
upstream's version (they will be functionally equivalent). If upstream adds
**new** scaffolder actions, ensure they also use the `z.object()` format —
the old builder format will crash on startup. If upstream modifies the
schema fields (adds/removes/renames fields) but keeps the old format,
apply the field changes but convert them to the `z.object()` format.

### 3. Scaffolder Module — Extension Point Import Path

The `scaffolderActionsExtensionPoint` was moved from
`@backstage/plugin-scaffolder-node/alpha` to `@backstage/plugin-scaffolder-node`
in newer Backstage versions. The import was updated accordingly.

**Affected file:**

- `plugins/core/scaffolder-actions/src/module.ts`

**What changed:**

```diff
-import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
+import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
```

**Merge guidance:** If upstream updates this import themselves, accept
upstream's version. If upstream still uses the `/alpha` path after a merge,
this fix must be reapplied — the old import returns `undefined` and causes
`TypeError: Cannot read properties of undefined (reading 'id')` at startup.

### 4. Fork-Only Files

These files exist only in the fork and should never conflict with upstream:

- `CLAUDE.md` — Claude Code guidance file
- `FORK_CHANGES.md` — this file

**Merge guidance:** Always keep these files. They will not conflict since
upstream does not have them.

## How to Merge Upstream

```bash
# Fetch latest upstream
git fetch upstream

# Merge upstream/main into the fork
git merge upstream/main

# If there are conflicts:
# 1. For package.json / yarn.lock: keep higher @backstage/* versions, then run yarn install
# 2. For scaffolder action schemas: ensure z.object() format is used (not the builder format)
# 3. For module.ts: ensure the import uses '@backstage/plugin-scaffolder-node' (not /alpha)
# 4. For CLAUDE.md / FORK_CHANGES.md: always keep ours (git checkout --ours)
```

## Keeping This File Updated

After each merge or fork-specific change, update this file to reflect the
current state of divergence. Remove entries that upstream has caught up to.
