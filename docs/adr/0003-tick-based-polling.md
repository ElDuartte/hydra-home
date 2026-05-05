# ADR-0003: Tick-Based Polling — Coalesced Master Tick

**Status:** Accepted

**Date:** 2026-05-05

## Context

The dashboard has 8 Glances subscriptions at different intervals:

| Endpoint | Interval | Count |
|---|---|---|
| `mem`, `sensors` | 1000 ms | 2 |
| `cpu` | 2000 ms | 1 |
| `network`, `gpu`, `containers` | 3000 ms | 3 |
| `fs` | 3600000 ms | 1 |

With one `setInterval` per endpoint (7 total timers), the system has:
- **Timer drift**: `network` and `gpu` both at 3000ms drift apart over time → ~2 requests/cycle instead of 1 concurrent batch
- **OS wakeups**: Up to 4 separate timer events per second (at 1s, 2s, 3s boundaries) on a 24/7 server
- **No coordination**: Related endpoints (e.g. network+gpu) fire asynchronously despite having the same interval

For a resource-constrained 24/7 server, unnecessary timers and wakeups accumulate.

## Decision

Replace per-endpoint timers with a **single 1000ms master tick**. Each subscription tracks `tickEvery = Math.round(interval / 1000)`. On each tick, an endpoint fetches only when `tickCount % tickEvery === 0`.

**Benefits:**
- One timer instead of 7 → OS wakeup once per second
- Zero drift: `network` (tickEvery=3) and `gpu` (tickEvery=3) fire on identical ticks
- Endpoints with same interval guaranteed synchronized → potential for request batching (future optimization)
- Asymptotic CPU savings: ~70% timer overhead reduction

## Implementation

### New Internal Structure

```javascript
this.baseTick = 1000           // ms, master tick rate (configurable)
this.tickCount = 0             // counter, increments each tick
this.masterTimerId = null      // single setInterval
this.subscriptions = Map<endpoint, { tickEvery: number, callbacks: Set }>
```

### Key Methods

**subscribe(endpoint, callback, interval):**
- Compute `tickEvery = Math.max(1, Math.round(interval / baseTick))`
- If endpoint new: add to map
- If endpoint exists: add callback; if tickEvery < current, update it (use min across all subscribers)
- If running: immediately fetch (warm start)

**start():**
- Immediate fetch for all endpoints (synchronized first data)
- Start `setInterval(() => _tick(), baseTick)`

**_tick():**
- Increment `tickCount`
- For each subscription: if `tickCount % tickEvery === 0`, call `_fetch(endpoint)`

**stop() / destroy():**
- Clear master timer
- No per-endpoint cleanup (no timers to clear)

### Public API Unchanged

Component code remains identical:
```javascript
poller.subscribe('cpu', (data) => { if (data) updateCpu(data); }, 2000);
```

## Consequences

### Benefits

- **Single timer**: OS wakeup once per second, not up to 4 times
- **Zero drift**: Endpoints with identical intervals fire on the same tick
- **Clean shutdown**: One `clearInterval` instead of 7
- **Testable**: Tick-based scheduler easier to mock and test
- **Foundation for batching**: All 3s endpoints synchronized → future `Promise.all([network, gpu])` in same tick

### Tradeoffs

- **1-hour interval penalty**: `fs` endpoint at 3600000ms requires 3600 ticks; master timer fires every 1s just to check `3600 % 3600`. Cost: trivial modulo check, no HTTP overhead.
- **Tick counter overflow**: At 1 tick/second, overflow to 2^53 takes ~285 million years. Acceptable.
- **No dynamic interval relaxation**: If the fastest subscriber unsubscribes, interval doesn't slow down to next-fastest. Same behavior as old system (design constraint for simplicity).

## Testing

1. **Tick synchronization**: Subscribe `network` and `gpu` at 3000ms, verify they fire in the same `_tick()` call — no drift.
2. **Master timer count**: Measure DevTools timer count before/after (7 timers → 1).
3. **Tick math**: Subscribe at 1s, 2s, 3s; verify fetch counts after 6 seconds: ~6, ~3, ~2.
4. **Late subscription**: Subscribe after `start()`; verify warm fetch + tick-based rotation.

## Related Decisions

- **ADR-0001**: Centralized config (foundation for ConfigLoader; poller gets baseTick from config if needed)
- **ADR-0002**: GlancesPoller subscription model (this ADR improves the timer strategy without changing the API)
- **ADR-0004** (future): Request batching — combine `network` + `gpu` into single `Promise.all` on shared ticks

## Migration Notes

- **No component changes** — `subscribe()` API identical
- **Public API backward-compatible** — existing code works without modification
- **baseTick configurable** — default 1000ms; could expose via config if needed for different polling strategies
