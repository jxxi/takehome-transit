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
