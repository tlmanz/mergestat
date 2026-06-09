# Incremental syncs

Most sync handlers historically used a **delete-all → re-insert-all** pattern: each run
deletes every row for the repo and re-inserts the full dataset. That's simple but wasteful —
it re-writes unchanged rows every cycle, generating dead tuples, bloating indexes, and (for
API-backed syncs) re-fetching data that hasn't changed.

This doc describes the incremental approach and tracks which handlers have adopted it.

## Strategy A — immutable, key-based (implemented for `git_commits`)

Git commits are **immutable** and uniquely identified by `(repo_id, hash)` (the `commits_pkey`
unique index). So a run never needs to rewrite an existing commit — only add new ones and drop
ones that have left history. [git_commits.go](../internal/syncer/git_commits.go) now does:

1. Walk all commits and COPY them into a **session-temp staging table**
   (`_git_commits_staging`, `ON COMMIT DROP`) — keeping the fast COPY read path.
2. `INSERT … SELECT … FROM _git_commits_staging ON CONFLICT (repo_id, hash) DO NOTHING` —
   insert only commits we don't already have.
3. `DELETE … WHERE NOT EXISTS (… staging …)` — prune commits that dropped out of history
   (force-push / rebase). Usually a no-op.

No schema migration is required (the unique index already exists). The win: unchanged commits
are never re-written, so steady-state syncs touch only new/removed rows.

**Applies cleanly to other immutable, key-based datasets:** `git_commit_stats`, `git_refs`
(by ref name), `github_stargazers`, PR/issue *comments* and *reviews* (by node id).

## Strategy B — mutable, updated-at based (planned)

GitHub PRs / issues are **mutable** (state, title, labels change). Incremental here means:

1. Track a per-(repo, sync-type) cursor of the max `updated_at` seen.
2. Fetch only items with `updated_at > cursor` from the GitHub API (the GraphQL/REST APIs
   support ordering by `UPDATED_AT`).
3. **Upsert** (`INSERT … ON CONFLICT (… node id …) DO UPDATE`) rather than delete-all.
4. Advance the cursor to the new max `updated_at`.

This needs a small schema addition (a cursor column or a `mergestat.sync_cursors` table keyed
by repo_sync_id) and per-handler changes, so it's tracked as follow-up work.

## Status

| Handler | Strategy | Status |
|---|---|---|
| `git_commits` | A (key-based) | ✅ implemented |
| `git_commit_stats`, `git_refs` | A | planned |
| `github_repo_prs`, `github_repo_issues` | B (updated_at cursor) | planned |
| `github_repo_stars` | A | planned |

> Note: handler changes live in the `syncer` package, which links `libgit2` — build/test with
> `make worker` (or `docker-compose build worker`) in an environment with `libgit2` available.
