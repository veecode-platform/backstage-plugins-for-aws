# Fork Merges Log

Append-only log of upstream→fork merges. Newest entry on top. The fork
point at the bottom is row zero and must not be edited.

For the procedure that produces each entry, see the recurring runbook
in `FORK_PLAN.md`. For the current state of divergence, see
`FORK_CHANGES.md`.

Entry schema:

```pre
## YYYY-MM-DD — <our merge commit short SHA>

- Upstream tip merged: <upstream short SHA> ("<commit subject>")
- Range absorbed: <prev upstream tip>..<new upstream tip> (N commits)
- Conflicts resolved:
  - <path>: <ours|upstream|manual — one line why>
- FORK_CHANGES entries retired: #N, #M (upstream caught up)
- FORK_CHANGES entries added: #X
- Post-merge checks: yarn install / yarn tsc / yarn test (status)
- Notes: <anything future-you will want to know>
```

---

<!-- New entries go above this line. -->

## 2026-05-22 — `63b60aa`

- Upstream tip merged: `7b8aa4a` ("chore(release): Publish")
- Range absorbed: `1b0c194..7b8aa4a` (24 commits — first merge since fork)
- Conflicts resolved:
  - 11 × `**/package.json`: **ours** — kept higher `@backstage/*` versions for Backstage 1.48.4. Dropped `@backstage/backend-common` dep where it lingered (upstream's intent in #560).
  - `plugins/securityhub/backend/src/service/router.ts`: **upstream** — implements our #9 intent more cleanly (full destructure, `httpAuth` non-optional).
  - `plugins/securityhub/backend/src/service/DefaultAwsSecurityHubService.ts`: **upstream** — modernizes `catalogApi: CatalogApi` → `CatalogService` from `@backstage/plugin-catalog-node`, drops `httpAuth` from `fromConfig` options.
- FORK_CHANGES entries retired: **#9** (Security Hub — Remove `@backstage/backend-common`). Upstream PR #560 supersedes.
- FORK_CHANGES entries added: none.
- Post-merge checks: `yarn install` ok / `yarn tsc` clean / `yarn test` 28 projects passing.
- Notes:
  - `packages/app/package.json`: kept ours; **deferred** adopting upstream's added `@backstage/ui": "^0.14.3"` line (upstream `14a7217`). Likely safe to add later but not validated this round.
  - `plugins/ecr/backend/src/config/config.ts` absorbed upstream's #580 fix (`maxImages` → `aws.ecr.maxImages`) cleanly with no conflict — that's a behavior-affecting config-key change worth flagging to downstream consumers.

## Row zero — fork point (do not edit)

- Forked from upstream commit: `1b0c194` (2026-02-07)
- Upstream commit subject: "fix(deps): update aws-sdk-js-v3 monorepo (#557)"
- Backstage version at fork point: 1.43.1
- Notes: this row anchors `FORK_CHANGES.md` and the divergence range.
  The "range absorbed" field of the first real merge entry should
  start at `1b0c194`.
