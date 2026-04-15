# Notes

## Assumptions & Reasoning

### Task 1 — `validateFeed`

**Problems:**

Structural integrity:
- Observation references a `stopId` not in the route's `stops` array (s9 in the sample is a live example of this)
- Route has no stops
- Route has no observations
- Duplicate stop IDs within a route
- Duplicate observation for the same `(stopId, day)` pair — ambiguous which to trust

Data quality:
- Negative boardings or alightings (physically impossible)
- A stop with zero total activity across all observations (possible data gap)
- Lat/lon out of valid range (lat: −90–90, lon: −180–180)
- Duplicate route IDs across the feed

- Duplicate lat/lon for two different stop IDs within the same route — almost certainly a data entry error. Cross-route stops sharing coordinates are fine (shared hubs).
- Route-level net flow imbalance >10% of total volume (boardings + alightings) — since the feed is the complete dataset, everyone who boards should eventually alight. Using 10% rather than strict zero to tolerate rounding in real ridership counts.

**What I'm intentionally NOT flagging:**
- Net flow imbalance at individual stops — expected (origins board more, destinations alight more)
- Missing days — routes legitimately don't run every day

### Task 2 — Stop ridership summary + trend

- `summarizeRouteStops(route)` returns one summary per declared stop (including stops with no observations).
- Trend is a typed union designed for planner actionability, not just raw stats:
  - `commuter-origin`
  - `commuter-destination`
  - `weekend-leisure`
  - `balanced`
  - `mixed`
  - `insufficient-data`
- Trend classification intentionally uses simple, explainable thresholds:
  - weekend-dominant if weekend activity share is at least 1.3x weekday share
  - weekday-dominant if weekday activity share is at least 1.3x weekend share
  - strong directional flow (stop is clearly one-sided, not just a small difference) if `abs(netFlow) / totalActivity >= 25%`, where `netFlow = totalBoardings - totalAlightings` and `totalActivity = totalBoardings + totalAlightings`
  - balanced if boardings and alightings stay close overall (`abs(netFlow) / totalActivity <= 10%`) and daily activity is fairly consistent (low volatility, measured via coefficient of variation)
- Confidence is derived from coverage (number of observed days), not raw volume, to avoid overconfidence on sparse data.
- `insufficient-data` is a coverage/confidence signal (not a low-ridership signal).

### Task 3 — Route health ranking

- `rankRoutesByHealth(routes)` returns ranked routes with a 0–100 score, reason strings, and a typed penalty breakdown.
- Score uses weighted penalties across four dimensions:
  - stability (40%): share of stops classified as `mixed`
  - utilization (30%): share of stops below a low-activity threshold
  - balance (20%): share of stops with extreme net-flow imbalance
  - coverage (10%): share of stops classified as `insufficient-data`
- Low-activity threshold is feed-relative (20th percentile) with a minimum floor so tiny stops are still penalized in small sample feeds.

### Domain typing policy

- Domain model types in `types.ts` are immutable (`Readonly` + readonly arrays) and do not allow null/undefined.

### If I had more time

- I'd add a dedicated raw ingestion layer (`unknown` -> validated domain model) before business logic.
