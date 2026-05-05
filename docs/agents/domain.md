# Domain Docs

Single-context layout: one `CONTEXT.md` at the repo root, plus `docs/adr/` for architectural decisions.

## CONTEXT.md

The `CONTEXT.md` file documents:
- What this project is and why it exists
- Core concepts and terminology
- Tech stack and key dependencies
- Known constraints or design decisions

Skills like `improve-codebase-architecture`, `diagnose`, and `tdd` read this to understand your domain.

## docs/adr/

Architecture Decision Records (ADRs) document significant decisions (e.g., "why we chose WebSocket over polling for stats updates", "why we use Docker Compose instead of Kubernetes"). Create one ADR per decision as `.md` files in `docs/adr/`.

Not required upfront—add them as decisions crystallize.
