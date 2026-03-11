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

The four scaffolder actions used the **old `z.object()` format** (direct
Zod import), which is incompatible with Backstage >= 1.48. They were
migrated to the **function wrapper format** (`input: z => z.object({...})`),
where `z` is injected by the scaffolder framework.

**Affected files:**

- `plugins/core/scaffolder-actions/src/actions/s3/cp.ts`
- `plugins/core/scaffolder-actions/src/actions/cloudcontrol/create.ts`
- `plugins/core/scaffolder-actions/src/actions/codecommit/publish.ts`
- `plugins/core/scaffolder-actions/src/actions/eventbridge/eventbridge.ts`

**What changed in each file:**

- Removed `import { z } from 'zod'` (no longer needed)
- Changed `input: z.object({ ... })` to `input: z => z.object({ ... })`
- Changed `output: z.object({ ... })` to `output: z => z.object({ ... })`
- No handler logic was modified

**Merge guidance:** If upstream migrates these schemas themselves, accept
upstream's version (they will be functionally equivalent). If upstream adds
**new** scaffolder actions, ensure they also use the `z => z.object()`
function wrapper format — the old format will fail type checking. If
upstream modifies the schema fields (adds/removes/renames fields) but keeps
the old format, apply the field changes but convert them to the function
wrapper format.

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

### 4. LangChain Import Fix

The `StreamEvent` type was imported from an internal `dist/` path that
is not a public export in newer `@langchain/core` versions.

**Affected file:**

- `plugins/genai/agent-langgraph/src/util/transform.ts`

**What changed:**

```diff
-import { StreamEvent } from '@langchain/core/dist/tracers/event_stream';
+import type { StreamEvent } from '@langchain/core/tracers/log_stream';
```

**Merge guidance:** If upstream fixes this import themselves, accept
upstream's version. If upstream still uses the internal `dist/` path,
this fix must be reapplied.

### 5. Circular Dependency Fix in Core Node

The `resource-locator-factory.ts` imported from the barrel `'.'`
(index.ts), which re-exports that same file, creating a circular
dependency. Fixed by using direct file imports.

**Affected file:**

- `plugins/core/node/src/locator/resource-locator-factory.ts`

**What changed:**

```diff
-import { AwsResourceLocator, AwsResourceTaggingApiLocator } from '.';
+import { AwsResourceLocator } from './resource-locator';
+import { AwsResourceTaggingApiLocator } from './resource-tagging-api-locator';
```

**Merge guidance:** If upstream fixes this themselves, accept upstream's
version. Otherwise reapply after merge.

### 6. Core Libraries — Backstage Dependencies as peerDependencies

Moved `@backstage/*` packages from `dependencies` to `peerDependencies`
(+ `devDependencies`) in the core libraries to prevent them from
propagating fixed Backstage versions to consumers.

**Affected files:**

- `plugins/core/common/package.json` — `@backstage/catalog-model`, `@backstage/config`
- `plugins/core/node/package.json` — `@backstage/backend-plugin-api`, `@backstage/config`, `@backstage/integration-aws-node`

**Merge guidance:** If upstream adds new `@backstage/*` dependencies to
these packages, ensure they go into `peerDependencies` + `devDependencies`
rather than `dependencies`.

### 7. Workspace Configuration

Added `!plugins/**/dist-dynamic/**` exclusion to the root `package.json`
workspaces to prevent Yarn from discovering `package.json` files inside
`dist-dynamic/embedded/` directories (which causes duplicate workspace
name errors).

**Affected file:**

- `package.json` (root)

**Merge guidance:** Preserve this exclusion after any merge.

### 8. Dynamic Plugin Support (ECS, ECR, Cost Insights, Security Hub, GenAI)

Added `@red-hat-developer-hub/cli` and `export-dynamic` scripts to
multiple plugin groups, enabling them to be exported as dynamic plugins
for Red Hat Developer Hub / DevPortal.

**Affected files (scripts + devDep added):**

- `plugins/ecs/frontend/package.json`, `plugins/ecs/backend/package.json`
- `plugins/ecr/frontend/package.json`, `plugins/ecr/backend/package.json`
- `plugins/cost-insights/frontend/package.json`, `plugins/cost-insights/backend/package.json`
- `plugins/securityhub/frontend/package.json`, `plugins/securityhub/backend/package.json`
- `plugins/genai/frontend/package.json`, `plugins/genai/backend/package.json`
- `plugins/genai/agent-langgraph/package.json`

**`.gitignore` files created** (all contain `dist-dynamic/`):

- `plugins/{ecs,ecr,cost-insights,securityhub,genai}/{frontend,backend}/.gitignore`
- `plugins/genai/agent-langgraph/.gitignore`

**Pinned workspace dependency versions fixed to `workspace:^`:**

- `plugins/securityhub/backend/package.json` — `@aws/aws-core-plugin-for-backstage-common`, `@aws/aws-core-plugin-for-backstage-node`, `@aws/genai-plugin-for-backstage-common`
- `plugins/securityhub/frontend/package.json` — `@aws/aws-core-plugin-for-backstage-common`, `@aws/aws-core-plugin-for-backstage-react`

**New fork-only files:**

- `dynamic-plugins.yaml` — dynamic plugin loading configuration (path-based)
- `docker-compose.yaml` — local dev with devportal image (path-based)
- `Makefile` — build, export, publish, and OCI packaging targets
- `app-config.dynamic.yaml` — app config for dynamic plugin dev

**Merge guidance:** The `export-dynamic` scripts, `@red-hat-developer-hub/cli`
devDep, and `.gitignore` files are fork-only additions. The `workspace:^`
fixes should be accepted by upstream or reapplied after merge.

### 9. Security Hub — Remove @backstage/backend-common

Replaced `createLegacyAuthAdapters` from the deprecated
`@backstage/backend-common` package with direct usage of `auth` and
`httpAuth` services from `@backstage/backend-plugin-api`. Removed the
`@backstage/backend-common` dependency entirely.

**Affected files:**

- `plugins/securityhub/backend/src/service/router.ts`
- `plugins/securityhub/backend/src/service/DefaultAwsSecurityHubService.ts`
- `plugins/securityhub/backend/package.json`

**What changed:**

```diff
-import { createLegacyAuthAdapters } from '@backstage/backend-common';
-const { httpAuth } = createLegacyAuthAdapters(options);
+const { httpAuth } = options;
```

**Merge guidance:** If upstream removes `@backstage/backend-common` usage
themselves, accept upstream's version. If upstream still uses it, this fix
must be reapplied since dynamic plugins cannot load `@backstage/backend-common`.

### 10. GenAI — Dynamic Import for SQLite Checkpoint

Changed `@langchain/langgraph-checkpoint-sqlite` from a static import to
a dynamic `import()` in the agent-langgraph plugin, so `better-sqlite3`
(a native module) is only loaded when the sqlite checkpoint backend is
configured. This enables `--suppress-native-package` in the dynamic
plugin export without failing entry point validation.

**Affected file:**

- `plugins/genai/agent-langgraph/src/LangGraphReactAgentType.ts`

**What changed:**

```diff
-import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
 ...
+const { SqliteSaver } = await import('@langchain/langgraph-checkpoint-sqlite');
```

**Merge guidance:** If upstream modifies `LangGraphReactAgentType.ts`,
ensure the sqlite import remains dynamic (not static). A static import
will break dynamic plugin export due to native module bundling.

### 11. GenAI — Self-Referencing Package.json Import

The genai backend's `McpService.ts` imported its own `package.json` via
the package name (`@aws/genai-plugin-for-backstage-backend/package.json`),
which fails in dynamic plugins where the package is renamed with a
`-dynamic` suffix. Changed to a relative import.

**Affected file:**

- `plugins/genai/backend/src/service/McpService.ts`

**What changed:**

```diff
-import { version } from '@aws/genai-plugin-for-backstage-backend/package.json';
+import packageJson from '../../package.json';
 ...
-  version,
+  version: packageJson.version,
```

**Merge guidance:** If upstream modifies `McpService.ts`, ensure the
`package.json` import uses a relative path, not the package name.

### 12. OCI Image Packaging

### 9. OCI Image Packaging

Added OCI image packaging workflow for distributing dynamic plugins as
container images. Uses a `FROM scratch` Containerfile that copies each
plugin's `dist-dynamic/` output into named directories.

**New fork-only files:**

- `Containerfile.dynamic` — multi-plugin OCI image (`FROM scratch`)
- `docker-compose-oci.yaml` — local dev with OCI registry + devportal
- `dynamic-plugins-oci.yaml` — plugin config using `oci://` references

**Modified files:**

- `.dockerignore` — added negation patterns for `dist-dynamic/` directories
- `Makefile` — added `package-oci` and `publish-oci` targets

**OCI directory naming convention:** Plugin directories in the image match
the npm package name without the `@aws/` scope (e.g.,
`aws-amazon-ecs-plugin-for-backstage-backend`).

**Merge guidance:** Fork-only. Upstream does not have OCI support.

### 13. Fork-Only Files

These files exist only in the fork and should never conflict with upstream:

- `CLAUDE.md` — Claude Code guidance file
- `.claude/MEMORY.md` — Claude Code project memory
- `FORK_CHANGES.md` — this file
- `Makefile` — build/publish/OCI automation
- `Containerfile.dynamic` — OCI image for dynamic plugins
- `docker-compose.yaml` — local dev with devportal (path-based)
- `docker-compose-oci.yaml` — local dev with devportal (OCI-based)
- `dynamic-plugins.yaml` — dynamic plugin configuration (path-based)
- `dynamic-plugins-oci.yaml` — dynamic plugin configuration (OCI-based)
- `app-config.dynamic.yaml` — app config for dynamic plugin dev
- `OCI.md` — OCI local testing guide
- `registries.conf` — insecure registry config for local dev

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
