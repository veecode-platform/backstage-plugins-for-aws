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

## Row zero — fork point (do not edit)

- Forked from upstream commit: `1b0c194` (2026-02-07)
- Upstream commit subject: "fix(deps): update aws-sdk-js-v3 monorepo (#557)"
- Backstage version at fork point: 1.43.1
- Notes: this row anchors `FORK_CHANGES.md` and the divergence range.
  The "range absorbed" field of the first real merge entry should
  start at `1b0c194`.
