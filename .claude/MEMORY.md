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

- ECS and ECR plugins configured for dynamic export via `@red-hat-developer-hub/cli`
- Root files: `dynamic-plugins.yaml`, `docker-compose.yaml`, `Makefile`
- `dist-dynamic/` directories are gitignored in each plugin's frontend/backend
- `plugins/**/dist-dynamic/**` excluded from Yarn workspaces to avoid duplicate workspace name errors

### Makefile targets

- `make build` — static build (install, tsc, build:all)
- `make build-dynamic` — static build + per-plugin `yarn export-dynamic`
- `make publish` — publish static plugins to npm
- `make publish-dynamic` — build-dynamic + npm publish from each dist-dynamic/

### rhdh-cli behavior

- `rhdh-cli plugin package` from root scans ALL workspace packages — not usable in this monorepo (tries to package codebuild, codepipeline, genai, etc.)
- Instead we run per-plugin `yarn export-dynamic` from each frontend/backend dir
- Backend plugins use `--embed-package` for `@aws/aws-core-plugin-for-backstage-common` and `@aws/aws-core-plugin-for-backstage-node`
- If a plugin has an `export-dynamic` script in package.json, `rhdh-cli plugin package` will use it (honors `--embed-package` flags)

## Merge Strategy

- For `package.json`/`yarn.lock` conflicts: keep higher `@backstage/*` versions, run `yarn install`
- For scaffolder schemas: always use `z => z.object()` function wrapper format
- For `module.ts`: import from `@backstage/plugin-scaffolder-node`, not `/alpha`
- For fork-only files: always keep ours
