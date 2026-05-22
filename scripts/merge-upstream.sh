#!/usr/bin/env bash
# Merge upstream/main into the current branch using the fork's documented
# conflict policy. Auto-resolves yarn.lock and fork-only files via
# .gitattributes (merge=ours). Lists remaining conflicts and prints a
# draft FORK_MERGES.md entry for the user to paste.
#
# Usage:
#   scripts/merge-upstream.sh           # fetch + merge
#   scripts/merge-upstream.sh --dry-run # show what would be merged
#   scripts/merge-upstream.sh --report  # post-merge: print draft entry only
#
# See FORK_PLAN.md for the surrounding runbook.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

color() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info()  { color "1;34" "==> $*"; }
warn()  { color "1;33" "!!  $*"; }
ok()    { color "1;32" "++  $*"; }
err()   { color "1;31" "xx  $*" >&2; }

DRY_RUN=0
REPORT_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --report)  REPORT_ONLY=1 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) err "unknown arg: $arg"; exit 2 ;;
  esac
done

ensure_merge_driver() {
  if [ "$(git config --get merge.ours.driver || true)" != "true" ]; then
    info "Registering local 'ours' merge driver (one-time setup)."
    git config merge.ours.driver true
    git config merge.ours.name "always keep ours during merge"
  fi
}

ensure_upstream_remote() {
  if ! git remote get-url upstream >/dev/null 2>&1; then
    err "No 'upstream' remote configured. Add it with:"
    err "  git remote add upstream https://github.com/awslabs/backstage-plugins-for-aws.git"
    exit 1
  fi
}

ensure_clean_tree() {
  if [ -n "$(git status --porcelain)" ]; then
    err "Working tree is not clean. Commit or stash first."
    git status --short
    exit 1
  fi
}

last_merged_upstream_sha() {
  # Look for "Upstream tip merged: <short>" in the newest non-row-zero entry
  # of FORK_MERGES.md. Falls back to the fork point if no merges yet.
  local sha
  sha="$(grep -m1 -oE 'Upstream tip merged: \`?[0-9a-f]{7,40}\`?' FORK_MERGES.md 2>/dev/null \
        | head -n1 \
        | grep -oE '[0-9a-f]{7,40}' || true)"
  if [ -z "$sha" ]; then
    sha="1b0c194" # fork point — row zero in FORK_MERGES.md
  fi
  echo "$sha"
}

draft_merge_entry() {
  local upstream_tip prev_tip range_count today merge_sha subject
  upstream_tip="$(git rev-parse --short upstream/main)"
  prev_tip="$(last_merged_upstream_sha)"
  range_count="$(git rev-list --count "${prev_tip}..upstream/main" 2>/dev/null || echo "?")"
  subject="$(git log -1 --format=%s upstream/main)"
  today="$(date +%Y-%m-%d)"
  merge_sha="$(git rev-parse --short HEAD 2>/dev/null || echo '<TBD>')"

  cat <<EOF

----- DRAFT FORK_MERGES.md entry (paste above the previous newest entry) -----

## ${today} — ${merge_sha}

- Upstream tip merged: \`${upstream_tip}\` ("${subject}")
- Range absorbed: \`${prev_tip}..${upstream_tip}\` (${range_count} commits)
- Conflicts resolved:
$(format_conflict_list)
- FORK_CHANGES entries retired: <fill in — items upstream caught up to>
- FORK_CHANGES entries added: <fill in or "none">
- Post-merge checks: yarn install / yarn tsc / yarn test (<fill status>)
- Notes: <fill in or remove>

------------------------------------------------------------------------------
EOF
}

format_conflict_list() {
  # Conflicts since the merge started. If none, say so.
  local conflicts
  conflicts="$(git diff --name-only --diff-filter=U 2>/dev/null || true)"
  if [ -z "$conflicts" ]; then
    # Post-merge: pull from last commit's combined diff if it was a merge
    if git rev-parse -q --verify HEAD^2 >/dev/null 2>&1; then
      echo "  - <none — auto-resolved by .gitattributes; list any manual edits here>"
    else
      echo "  - <none>"
    fi
    return
  fi
  while IFS= read -r f; do
    echo "  - \`$f\`: <ours|upstream|manual — one line why>"
  done <<< "$conflicts"
}

list_upstream_commits() {
  local prev_tip
  prev_tip="$(last_merged_upstream_sha)"
  info "Upstream commits in range ${prev_tip}..upstream/main:"
  git log --oneline "${prev_tip}..upstream/main" || true
}

# --- main flow ---

ensure_upstream_remote
ensure_merge_driver

if [ "$REPORT_ONLY" -eq 1 ]; then
  draft_merge_entry
  exit 0
fi

ensure_clean_tree

info "Fetching upstream…"
git fetch upstream

PREV_TIP="$(last_merged_upstream_sha)"
NEW_TIP="$(git rev-parse --short upstream/main)"
COUNT="$(git rev-list --count "${PREV_TIP}..upstream/main" 2>/dev/null || echo 0)"

if [ "$COUNT" = "0" ]; then
  ok "Nothing to merge. We're up to date with upstream/main (${NEW_TIP})."
  exit 0
fi

info "${COUNT} upstream commits to absorb (${PREV_TIP}..${NEW_TIP})."
list_upstream_commits

if [ "$DRY_RUN" -eq 1 ]; then
  warn "--dry-run set; not merging."
  exit 0
fi

info "Merging upstream/main…"
if git merge --no-ff --no-edit upstream/main; then
  ok "Merge completed without conflicts."
else
  warn "Conflicts remain. Files needing manual resolution:"
  git diff --name-only --diff-filter=U | sed 's/^/    /'
  echo
  warn "Resolve them per FORK_CHANGES.md guidance, then:"
  echo "    yarn install        # regenerate yarn.lock against merged manifests"
  echo "    yarn tsc && yarn test"
  echo "    git add <files> && git commit"
  echo "    scripts/merge-upstream.sh --report   # to print the FORK_MERGES entry"
  draft_merge_entry
  exit 1
fi

info "Regenerating yarn.lock against merged manifests…"
if command -v yarn >/dev/null 2>&1; then
  yarn install
  if ! git diff --quiet yarn.lock; then
    git add yarn.lock
    git commit --amend --no-edit
    ok "yarn.lock regenerated and folded into merge commit."
  fi
else
  warn "yarn not on PATH — run 'yarn install' manually."
fi

ok "Done. Next steps:"
echo "  - yarn tsc && yarn test"
echo "  - Update FORK_CHANGES.md (retire items upstream caught up to)"
echo "  - Append the entry below to FORK_MERGES.md"
echo "  - Append a FORK_CHANGELOG.md entry if fork-side code changed"
draft_merge_entry
