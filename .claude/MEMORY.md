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
- Fork-only files: `CLAUDE.md`, `FORK_CHANGES.md`, `.claude/MEMORY.md`

## Dynamic Plugins

- ECS plugins configured for dynamic export via `@red-hat-developer-hub/cli`
- Root files: `dynamic-plugins.yaml`, `docker-compose.yaml`, `Makefile`
- Build dynamic: `make build-dynamic` (runs static build first, then `rhdh-cli plugin export`)
- `dist-dynamic/` directories are gitignored in frontend/backend

## Merge Strategy

- For `package.json`/`yarn.lock` conflicts: keep higher `@backstage/*` versions, run `yarn install`
- For scaffolder schemas: always use `z => z.object()` function wrapper format
- For `module.ts`: import from `@backstage/plugin-scaffolder-node`, not `/alpha`
- For fork-only files: always keep ours
