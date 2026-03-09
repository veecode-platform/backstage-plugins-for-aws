# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
