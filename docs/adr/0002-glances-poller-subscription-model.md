# ADR-0002: Glances Poller — Subscription-Based Deduplication

**Status:** Accepted

**Date:** 2026-05-05

## Context

The dashboard had 3 separate `GlancesAPI` instances and 7 independent `setInterval` calls across components:

- **SystemStats**: 5 hardcoded intervals (cpu@2s, mem@1s, sensors@1s, fs@1h, network+gpu@3s)
- **DockerContainers**: BaseComponent polling at 3s
- **JellyfinCard**: Glances polling + Jellyfin API polling; calls `getDocker()` to find its container

**The waste:** Both DockerContainers and JellyfinCard independently polled `/containers` at 3s and 5s respectively. Two HTTP requests for identical data.

**Resource constraint:** 24/7 server on old laptop; every unnecessary request matters.

## Decision

Introduce a `GlancesPoller` singleton that centralizes all Glances polling:

1. **Single GlancesAPI instance** — shared by all components via dependency injection
2. **Subscription model** — components call `poller.subscribe(endpoint, callback, interval)`
3. **Request deduplication** — if two components subscribe to the same endpoint, only one HTTP fetch; data delivered to both
4. **Per-endpoint timers** — each endpoint has its own timer, scaled to the fastest subscriber's interval

## Implementation

### GlancesPoller (`src/js/glances-poller.js`)

```javascript
class GlancesPoller {
    subscribe(endpoint, callback, interval)
    // Returns unsubscribe function. If endpoint already subscribed,
    // uses min(existing interval, new interval). Stores callbacks in a Set.
    
    start()    // Starts all timers
    stop()     // Clears all timers
    destroy()  // stop() + clear subscriptions
}

// Internal: Map<endpoint, { interval, callbacks: Set, timerId }>
```

When a timer fires:
1. Fetch endpoint via GlancesAPI
2. Deliver data (or null on error) to all callbacks
3. Each callback is null-safe (components check `if (data)`)

### Component Changes

**SystemStats.js**: 5 `setInterval` → 5 `poller.subscribe()` calls
- Removed: `this.intervals[]`, `startUpdates()` override, `GlancesAPI` instance
- Added: `this.unsubscribers[]`, cleanup in `destroy()`

**DockerContainers.js**: `BaseComponent.startUpdates()` → `poller.subscribe()`
- Removed: `GlancesAPI` instance, `update()` method
- Added: `destroy()` for unsubscribe

**JellyfinCard.js**: Separated Glances polling from Jellyfin API polling
- Jellyfin API: stays as `update()` + `BaseComponent.startUpdates()`
- Containers: `poller.subscribe()` with cached data
- Render triggered by either data source arriving

**Main.js**: Creates poller, injects into components, starts after init

## Consequences

### Benefits

- **Eliminated duplicate requests:** `/containers` now 1 request every 3s (was 2 per cycle)
- **Centralized error handling:** All Glances failures propagate consistently
- **Resource-aware:** Deduplication saves network and CPU on constrained server
- **Testable:** Poller is injectable; components mock it easily
- **Clean cleanup:** Components unsubscribe; no lingering intervals

### Tradeoffs

- **More code upfront:** GlancesPoller class + subscribe calls vs. `setInterval`
  - Acceptable: code is more maintainable; deduplication pays off
- **No request coalescing yet:** Each interval fires independently
  - Future: ADR-0003 can add "batched tick" scheduler to combine 1s/2s/3s into single requests
  
## Testing

1. **Network tab**: Confirm `/containers` appears once per 3s (not twice per cycle)
2. **Network tab**: Confirm other endpoints appear at expected intervals
3. **Error handling**: Kill Glances → components render errors; no JS exceptions
4. **Recovery**: Restart Glances → components update on next tick
5. **Cleanup**: Navigate away → confirm all intervals cleared, no memory leaks

## Related Decisions

- **ADR-0001**: Centralized config architecture (foundation for injecting poller)
- **ADR-0003** (future): Request batching/interval coalescing — combine 1s/2s/3s updates into single scheduler tick

## Migration Notes

- Old `src/js/config.js` fallback method: not used; components receive config via ConfigManager event
- Old `glances.js` default URL: still in place as fallback, but main.js injects `/api/glances` URL
- Components that didn't use Glances (Weather, Clock, etc.): unchanged
