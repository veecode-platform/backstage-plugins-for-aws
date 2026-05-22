<!--
  Template for the issue body produced by
  .github/workflows/upstream-divergence.yml.

  Placeholders use ${NAME} syntax and are substituted by envsubst at
  workflow time. To change the layout, edit this file — the workflow
  has no inline formatting of its own. Available placeholders:

    ${GENERATED_AT}        — timestamp the workflow ran (UTC)
    ${FORK_POINT}          — immutable fork point SHA
    ${LAST_MERGED_TIP}     — last upstream tip absorbed (from FORK_MERGES.md)
    ${UPSTREAM_TIP}        — current upstream/main short SHA
    ${NEW_SINCE_LAST}      — commits in LAST_MERGED_TIP..upstream/main
    ${BEHIND_TOTAL}        — commits in HEAD..upstream/main
    ${AHEAD_TOTAL}         — commits on main not in upstream/main
    ${COMMIT_LIST_BLOCK}   — fenced code block listing new upstream commits
                             (or "_None — fork is caught up to upstream/main._")
    ${DIFFSTAT_BLOCK}      — fenced code block with `git diff --stat` output
                             (or "_No file changes to report._")

  Only the variables listed above are substituted; any other ${...}
  in this file is left untouched (the workflow passes a strict list
  to envsubst).
-->

_Generated ${GENERATED_AT} by `.github/workflows/upstream-divergence.yml`._

## Summary

| Metric | Value |
|---|---|
| Fork point | `${FORK_POINT}` |
| Last merged upstream tip | `${LAST_MERGED_TIP}` |
| Current upstream tip | `${UPSTREAM_TIP}` |
| Upstream commits since last merge | ${NEW_SINCE_LAST} |
| Total: commits in `upstream/main` not on `main` | ${BEHIND_TOTAL} |
| Total: commits on `main` not in `upstream/main` | ${AHEAD_TOTAL} |

## Upstream commits since last recorded merge

${COMMIT_LIST_BLOCK}

## File-level change summary

${DIFFSTAT_BLOCK}

## Next steps

- Inspect the commits above for any that overlap with open `FORK_CHANGES.md` items.
- When ready, run the `merge-upstream` Claude skill or `scripts/merge-upstream.sh` locally.
- See `FORK_PLAN.md` for the full runbook.
