# Claude Code Configuration

This file documents how Claude Code is configured for this project, plus project-specific architectural decisions.

## Agent skills

### Issue tracker

GitHub Issues as primary, with local markdown (`.scratch/`) as a mirror. See `docs/agents/issue-tracker.md`.

### Triage labels

Two-label workflow: `ready-to-build` for actionable items, `wontfix` for rejected issues. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with `CONTEXT.md` at repo root. See `docs/agents/domain.md`.

## Configuration Architecture

The dashboard uses a centralized configuration system with a single source of truth on the backend:

- **Backend**: `lib/config-loader.js` loads `variables.json` with schema validation, applies env var overrides for secrets
- **Frontend**: `src/js/config-manager.js` is an event-driven singleton; emits `configReady` when loaded
- **Startup**: `src/js/main.js` waits for `configReady`, then initializes components
- **Components**: Receive config through constructor options; have sensible `defaults()` for fallback

**Key files:**
- `variables.json` — project configuration (cities, theme overrides, jellyfin settings)
- `.env` — secrets and system config (API keys, ports, service URLs)
- `docs/adr/0001-centralized-config-architecture.md` — full design rationale

**Lenient approach**: Missing config values use defaults and log warnings; app never crashes on bad config.

See ADR-0001 for architectural details and ADR conflicts if you're changing the config system.
