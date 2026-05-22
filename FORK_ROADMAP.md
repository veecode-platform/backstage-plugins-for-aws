# Fork Roadmap

Backlog of fork-side work that isn't yet done. The other `FORK_*` files
record state (`FORK_CHANGES.md`), history (`FORK_CHANGELOG.md`,
`FORK_MERGES.md`), and process (`FORK_PLAN.md`). This one is the
**inventory of intent**: what's still missing, what's parked, and what's
explicitly out of scope.

Update when an item lands (move it to `FORK_CHANGELOG.md` and delete it
here) or when a new item appears.

---

## Dynamic plugin / OCI build coverage

The OCI image (`Containerfile.dynamic`, `make package-oci`) bundles every
plugin that has an `export-dynamic` script in its `package.json` and a
matching entry in `dynamic-plugins.yaml`. "OCI-ready" means both.

### Ready

| Plugin | Frontend | Backend | Notes |
|---|---|---|---|
| ECS | ✅ | ✅ | |
| ECR | ✅ | ✅ | |
| Cost Insights | ✅ | ✅ | |
| Security Hub | ✅ | ✅ | |
| GenAI | ✅ | ✅ | plus `agent-langgraph` module ✅ |
| Catalog Config (AWS Config provider) | n/a | ✅ | `backend-plugin-module` |

### TODO

| # | Plugin | Frontend | Backend | Notes |
|---|---|---|---|---|
| R1 | CodePipeline | ❌ | ❌ | Pattern identical to ECS/ECR. Add `export-dynamic` to both `package.json` files, `dist-dynamic/` to `.gitignore`, wire into `dynamic-plugins.yaml` and `Containerfile.dynamic`. |
| R2 | CodeBuild | ❌ | ❌ | Same shape as R1. Often deployed alongside CodePipeline, so doing them in the same change is natural. |
| R3 | Scaffolder Actions (`plugins/core/scaffolder-actions`) | n/a | ❌ | `backend-plugin-module`, mirrors `catalog-config`. Before adding, verify the four actions (s3/cp, cloudcontrol/create, codecommit/publish, eventbridge) tolerate `--suppress-native-package` and don't pull a native dep transitively. |

### Not applicable — libraries embedded at export time

These are pulled into other plugins' dynamic bundles via `--embed-package`.
They should never grow an `export-dynamic` script:

- `plugins/core/{common,node,react}`
- `plugins/genai/{common,node}`
- All `plugins/*/common`

---

## Parked decisions (out of scope; here so we stop re-deciding)

- **LocalStack dev mode.** Tempting because the plugins all touch real AWS,
  but each plugin uses a different surface (ECS, ECR, Cost Explorer,
  Security Hub, Bedrock) and LocalStack coverage of those varies. Cost of
  maintaining wiring > value. A minimal real-AWS scratch account (one
  tagged ECS service + ECR repo + CodeBuild project) is cheaper.
- **Real-AWS e2e suite.** `playwright.config.ts` exists with one trivial
  test. Building meaningful AWS e2e would require fixtures, IAM, and a
  paid AWS account in CI. Not worth it for a fork.
- **Backstage core libs as dynamic plugins.** Not how dynamic plugins
  work; the host distro provides those.
- **Upstreaming the fork bug fixes** (zod migration, scaffolder
  extension-point import, langchain import, circular dep,
  peerDependencies). Possible later win; deferred per `FORK_PLAN.md`.

---

## How to retire an item

When R1/R2/R3 lands:

1. Move the row out of "TODO" into "Ready".
2. Append a dated entry to `FORK_CHANGELOG.md`.
3. Update `FORK_CHANGES.md` item #8 (Dynamic Plugin Support) so the
   affected-files list stays accurate.
