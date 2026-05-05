# Issue Tracker

Issues are tracked in **GitHub Issues** (primary) with local markdown mirrors under `.scratch/`.

## Creating issues

Skills like `to-issues` and `to-prd` create issues directly in GitHub using the `gh` CLI. Local markdown files (`.scratch/<feature>/issue.md`) can be created alongside for offline reference or backup.

## Reading issues

Skills read from both GitHub Issues and `.scratch/` markdown files. GitHub is authoritative; local markdown is secondary.

## Workflow

1. New issues created in GitHub (via `to-issues`, `triage`, etc.)
2. Optional: mirror to `.scratch/` for offline tracking
3. Link issues in commit messages: `fixes #123`
