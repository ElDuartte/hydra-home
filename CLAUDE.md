# Claude Code Configuration

This file documents how Claude Code is configured for this project.

## Agent skills

### Issue tracker

GitHub Issues as primary, with local markdown (`.scratch/`) as a mirror. See `docs/agents/issue-tracker.md`.

### Triage labels

Two-label workflow: `ready-to-build` for actionable items, `wontfix` for rejected issues. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with `CONTEXT.md` at repo root. See `docs/agents/domain.md`.
