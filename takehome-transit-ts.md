# Take-Home Assignment: Transit Feed Explorer

**Time budget:** ~2 hours. We'll send this file at the start of your window and look forward to submission by the end of the window.
**Stack:** TypeScript (Node.js or browser — your choice)  
**AI assistance:** Encouraged — use Claude, Copilot, or any tool you like. Be ready to discuss every line.

---

## Background

You're building a small tool to help transit agencies understand their route data. You've been given a simplified snapshot of a public transit feed: a list of routes, each with stops and recent ridership observations.

```typescript
type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

type RidershipObservation = {
  stopId: string;
  boardings: number;
  alightings: number;
  day: DayOfWeek;
};

type Route = {
  id: string;
  name: string;
  stops: Stop[];
  observations: RidershipObservation[];
};

const feed: Route[] = [ /* provided separately — see feed.ts */ ];
```

A `feed.ts` file with sample data is included at the bottom of this document.

---

## Tasks

Work through as many of these as you can in ~2 hours. Partial solutions are fine — depth on fewer tasks beats shallow coverage of all of them.

### 1. Data integrity (warm-up)
Write a function `validateFeed(feed: Route[])` that checks the data for consistency issues and returns a typed report of any problems found. What counts as a problem is up to you — document your reasoning.

### 2. Stop-level ridership summary
Write a function that, given a route, returns a summary for each stop: total boardings, total alightings, net flow (boardings minus alightings), and a `trend` field of your own design that captures something meaningful about how ridership at that stop varies across the week. The return type should be precise.

### 3. Route comparison
Write a function that accepts a list of routes and returns them ranked by a "health" score of your own design. The score should account for more than just total ridership. Document why you weighted things the way you did.

### 4. Anomaly detection
Write a function that identifies stops or days that look anomalous across the feed — e.g. stops with unusually high or low net flow, or days where ridership patterns diverge from the weekly norm. Your definition of "anomalous" is part of the problem. Explain your approach in a comment.

### 5. (Stretch) CLI or UI
Expose one or more of the above functions through a small CLI (`ts-node index.ts --route 42 --summary`) or a minimal browser UI. Prioritize a good experience for a transit planner who needs to act on the output quickly — that means thinking about formatting, units, and what to surface vs. hide.

---

## What we're looking for

- **Types**: Are they precise? Do they do work, or are they just `any` with extra steps?
- **Reasoning**: Where you had to define something (what's "healthy"? what's "anomalous"?), did you make a defensible choice and communicate it?
- **Edge cases**: Which cases seem "weird" or somehow important to call out? How did you handle them? How did you communicate about them?
- **UX instincts** (especially for task 5): Does the output serve a real user, or does it just dump data?
- **Claude use**: We're not testing whether you used AI — we're testing whether you understood and owned what you shipped.

---

## Packaging your submission

Please submit a single zip or repo link containing and email it to your interviewer (or joshua@recidiviz.org if you are unsure):

1. `solution.ts` (or equivalent entry point)
2. `feed.ts` (you may modify the sample data if useful for testing)
3. `NOTES.md` — a short document (bullet points are fine) covering:
   - Assumptions you made and why
   - Any tasks you skipped and what you'd have done with more time
   - One thing you'd change about your approach if this were production code

Keep it to what you'd actually show in a pull request, not a polished portfolio piece.

---

## Sample data (`feed.ts`)

```typescript
export const feed: Route[] = [
  {
    id: "route-1",
    name: "Downtown Express",
    stops: [
      { id: "s1", name: "Central Station", lat: 40.712, lon: -74.006 },
      { id: "s2", name: "City Hall", lat: 40.713, lon: -74.008 },
      { id: "s3", name: "Harbor View", lat: 40.700, lon: -74.020 },
    ],
    observations: [
      { stopId: "s1", boardings: 120, alightings: 10, day: "mon" },
      { stopId: "s1", boardings: 95,  alightings: 8,  day: "tue" },
      { stopId: "s1", boardings: 300, alightings: 12, day: "wed" },
      { stopId: "s2", boardings: 40,  alightings: 60, day: "mon" },
      { stopId: "s2", boardings: 38,  alightings: 55, day: "tue" },
      { stopId: "s3", boardings: 5,   alightings: 80, day: "mon" },
      { stopId: "s3", boardings: 6,   alightings: 75, day: "tue" },
      { stopId: "s3", boardings: 4,   alightings: 90, day: "wed" },
    ],
  },
  {
    id: "route-2",
    name: "Airport Shuttle",
    stops: [
      { id: "s4", name: "Terminal A", lat: 40.641, lon: -73.778 },
      { id: "s5", name: "Terminal B", lat: 40.642, lon: -73.780 },
      { id: "s6", name: "Midtown Hub", lat: 40.754, lon: -73.990 },
    ],
    observations: [
      { stopId: "s4", boardings: 200, alightings: 15, day: "fri" },
      { stopId: "s4", boardings: 310, alightings: 20, day: "sat" },
      { stopId: "s4", boardings: 280, alightings: 18, day: "sun" },
      { stopId: "s5", boardings: 180, alightings: 12, day: "fri" },
      { stopId: "s6", boardings: 10,  alightings: 400, day: "fri" },
      { stopId: "s6", boardings: 12,  alightings: 420, day: "sat" },
      { stopId: "s9", boardings: 50,  alightings: 50, day: "mon" },
    ],
  },
  {
    id: "route-3",
    name: "Night Owl",
    stops: [
      { id: "s7", name: "University Ave", lat: 40.730, lon: -73.997 },
      { id: "s8", name: "Warehouse District", lat: 40.720, lon: -74.005 },
    ],
    observations: [
      { stopId: "s7", boardings: 15, alightings: 2,  day: "fri" },
      { stopId: "s7", boardings: 40, alightings: 5,  day: "sat" },
      { stopId: "s8", boardings: 2,  alightings: 20, day: "fri" },
      { stopId: "s8", boardings: 5,  alightings: 45, day: "sat" },
    ],
  },
];
```
