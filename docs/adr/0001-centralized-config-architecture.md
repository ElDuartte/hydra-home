# ADR-0001: Centralized Configuration Architecture

**Status:** Accepted

**Date:** 2026-05-05

## Context

The dashboard had configuration scattered across multiple locations:
- `server.js`: Backend defaults and environment variable overrides
- `src/js/config.js`: Frontend defaults that duplicated backend defaults
- Component files: Hardcoded update intervals and other settings

This led to:
- **Dual loading:** Frontend had both async `loadConfig()` and sync defaults, causing race conditions
- **Duplication:** Same defaults in multiple places (backend and frontend)
- **Soft failures:** No validation; invalid config silently fell back to hardcoded values
- **Tight coupling:** Components accessed global config object; hard to test and refactor

## Decision

Implement a centralized configuration architecture with a single source of truth:

1. **Backend ConfigLoader** (`lib/config-loader.js`):
   - Loads `variables.json` with schema validation
   - Applies environment variable overrides for secrets/networking
   - Returns separate backend config (backend-only values) and frontend config (cleaned, validated)
   - Uses lenient validation: missing values get defaults, soft failures logged as warnings

2. **Frontend ConfigManager** (`src/js/config-manager.js`):
   - Event-driven singleton using EventTarget
   - Single async `load()` method; emits `configReady` or `configFailed`
   - Components subscribe via `onReady(callback)` and `onFailed(callback)`
   - No sync defaults; frontend never returns stale fallback config

3. **Component defaults:**
   - Each component's `defaults()` method provides sensible fallbacks (e.g., Weather: 30-min interval)
   - Constructor options from main.js override defaults
   - If config value missing, component uses its default (lenient, per-component level)

4. **Startup flow:**
   - main.js loads config via configManager
   - On `configReady`: initialize Dashboard, pass config to components
   - On `configFailed`: show error UI (not partial dashboard)
   - Components never run without config

## Consequences

### Benefits
- **Single source of truth:** Backend serves all config; frontend never duplicates
- **Lenient validation:** Missing values logged, don't crash; easy to add new config later
- **Decoupled:** Components don't access global config; testable with mocked config
- **Flexible secrets:** Env vars handle secrets (Docker standard); everything else in variables.json
- **Resource-aware:** Config can control update intervals per component
- **Clear error handling:** Config failures obvious and explicit (error UI, not silent fallback)

### Tradeoffs
- **No dynamic reload:** Config loaded once at startup. Changes to variables.json require restart.
  - Acceptable: 24/7 server doesn't change config mid-run; old laptop benefits from no polling
- **Event emitter pattern:** Slightly more code than sync access, but enables decoupling
  - Acceptable: EventTarget is native; components can be tested without global state

## Implementation

- Backend: `lib/config-loader.js` — centralized validation and defaults
- Frontend: `src/js/config-manager.js` — event emitter for config readiness
- Main: `src/js/main.js` — orchestrates config load and component init
- Schema: Defined in ConfigLoader with per-field validation and defaults

## Testing

- ConfigLoader: Unit test with invalid/missing config values; verify defaults apply and warnings logged
- ConfigManager: Unit test fetch failure; verify `configFailed` event emitted and error detail passed
- Integration: Load app in browser; verify error UI on config failure, dashboard on success

## Related Decisions

- ADR-0002 (future): Polling strategy — how often components fetch data
- ADR-0003 (future): Theme persistence — whether theme stored server-side or client-side
