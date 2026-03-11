# Project Memory

## Fork Context

- **Origin:** `veecode-platform/backstage-plugins-for-aws`
- **Upstream:** `awslabs/backstage-plugins-for-aws` (remote name: `upstream`)
- Fork divergence is documented in `FORK_CHANGES.md` at the repo root
- Always consult `FORK_CHANGES.md` before merging upstream

## Key Fork Changes

- Backstage upgraded to 1.48.4 (upstream is on 1.43.1)
- Scaffolder action schemas migrated to function wrapper format: `input: z => z.object({...})` (not bare `z.object()`)
- The `import { z } from 'zod'` is no longer needed in scaffolder actions — `z` comes as a function parameter
- `scaffolderActionsExtensionPoint` import moved from `/alpha` to main export
- `@langchain/core` StreamEvent import: use `@langchain/core/tracers/log_stream` (not internal `dist/` path)
- Circular dependency in `core/node` resource-locator-factory fixed (direct imports instead of barrel)
- Core common/node packages have `@backstage/*` as peerDependencies (not dependencies) to avoid propagation
- Fork-only files: `CLAUDE.md`, `FORK_CHANGES.md`, `.claude/MEMORY.md`

## Dynamic Plugins

- ECS, ECR, cost-insights, securityhub, and genai plugins configured for dynamic export via `@red-hat-developer-hub/cli`
- Root files: `dynamic-plugins.yaml`, `docker-compose.yaml`, `Makefile`
- `dist-dynamic/` directories are gitignored in each plugin's frontend/backend
- `plugins/**/dist-dynamic/**` excluded from Yarn workspaces to avoid duplicate workspace name errors

### Makefile targets

- `make build` — static build (install, tsc, build:all)
- `make build-dynamic` — static build + per-plugin `yarn export-dynamic`
- `make publish` — publish static plugins to npm
- `make publish-dynamic` — build-dynamic + npm publish from each dist-dynamic/

### OCI image packaging

- `Containerfile.dynamic` — `FROM scratch`, copies each plugin's `dist-dynamic/` into named directories
- Directory naming: strip `@aws/` prefix, remove `-dynamic` suffix (e.g., `aws-amazon-ecs-plugin-for-backstage-backend`)
- `.dockerignore` has negation patterns to allow `dist-dynamic/` through: `!plugins/*/frontend/dist-dynamic`, `!plugins/*/backend/dist-dynamic`
- `make package-oci` — builds dynamic plugins then builds OCI image
- `make publish-oci` — package-oci + push to `$(IMAGE_REGISTRY)`
- Override registry for local dev: `make package-oci IMAGE_REGISTRY=localhost:5000`
- `docker-compose-oci.yaml` — local registry (registry:2) + devportal using OCI plugin references
- `dynamic-plugins-oci.yaml` — uses `oci://registry:5000/image:tag!package-name` format
- Tag `pre-oci-packaging` marks the commit before OCI work was added

### rhdh-cli behavior

- `rhdh-cli plugin package` from root scans ALL workspace packages — not usable in this monorepo (tries to package codebuild, codepipeline, genai, etc.)
- Instead we run per-plugin `yarn export-dynamic` from each frontend/backend dir
- Backend plugins use `--embed-package` for `@aws/aws-core-plugin-for-backstage-common` and `@aws/aws-core-plugin-for-backstage-node`
- If a plugin has an `export-dynamic` script in package.json, `rhdh-cli plugin package` will use it (honors `--embed-package` flags)
- Native modules (e.g., `better-sqlite3`) cannot be bundled in dynamic plugins. Options: `--shared-package` (host provides it), `--suppress-native-package` (remove it, but entry point validation fails if code imports it at top level), or refactor to dynamic `import()` so the module is only loaded at runtime
- `agent-langgraph` uses dynamic `import()` for `@langchain/langgraph-checkpoint-sqlite` to avoid bundling `better-sqlite3` — this is a fork change to upstream code

### Plugin-specific notes

- securityhub backend embeds `@aws/genai-plugin-for-backstage-common` (it imports `DefaultAgentClient`)
- securityhub had pinned versions (`"0.5.0"`, `"0.1.0"`, `"^0.4.0"`) for workspace deps — fixed to `workspace:^`
- securityhub backend: removed `@backstage/backend-common` dep, replaced `createLegacyAuthAdapters` with direct `auth`/`httpAuth` usage
- genai backend: `McpService.ts` self-referencing package.json import changed to relative `../../package.json`
- genai frontend exports `AgentChatPage` (standalone page at `/aws-genai`, not an entity tab)
- genai agent-langgraph uses `--suppress-native-package better-sqlite3 --suppress-native-package napi-build-utils` + dynamic `import()` for sqlite checkpoint
- cost-insights frontend is an API provider only (no UI components) — no `pluginConfig` needed

## Merge Strategy

- For `package.json`/`yarn.lock` conflicts: keep higher `@backstage/*` versions, run `yarn install`
- For scaffolder schemas: always use `z => z.object()` function wrapper format
- For `module.ts`: import from `@backstage/plugin-scaffolder-node`, not `/alpha`
- For fork-only files: always keep ours
