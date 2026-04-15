import type { Route } from "../types";
import { rankRoutesByHealth } from "./index";

function makeRoute(input: {
  id: string;
  name: string;
  stops: Array<{ id: string; name: string }>;
  observations: Route["observations"];
}): Route {
  return {
    id: input.id,
    name: input.name,
    stops: input.stops.map((stop, idx) => ({
      id: stop.id,
      name: stop.name,
      lat: 40 + idx * 0.001,
      lon: -74 - idx * 0.001,
    })),
    observations: input.observations,
  };
}

describe("rankRoutesByHealth", () => {
  it("ranks healthier, stable routes above volatile and low-activity routes", () => {
    const healthy = makeRoute({
      id: "r-healthy",
      name: "Healthy",
      stops: [
        { id: "s1", name: "A" },
        { id: "s2", name: "B" },
      ],
      observations: [
        { stopId: "s1", boardings: 120, alightings: 118, day: "mon" },
        { stopId: "s1", boardings: 125, alightings: 123, day: "tue" },
        { stopId: "s1", boardings: 121, alightings: 120, day: "wed" },
        { stopId: "s2", boardings: 80, alightings: 82, day: "mon" },
        { stopId: "s2", boardings: 84, alightings: 82, day: "tue" },
        { stopId: "s2", boardings: 82, alightings: 81, day: "wed" },
      ],
    });

    const lowUse = makeRoute({
      id: "r-low",
      name: "Low Use",
      stops: [
        { id: "s3", name: "C" },
        { id: "s4", name: "D" },
      ],
      observations: [
        { stopId: "s3", boardings: 3, alightings: 2, day: "mon" },
        { stopId: "s3", boardings: 2, alightings: 3, day: "tue" },
        { stopId: "s4", boardings: 4, alightings: 3, day: "mon" },
        { stopId: "s4", boardings: 3, alightings: 4, day: "tue" },
      ],
    });

    const mixed = makeRoute({
      id: "r-mixed",
      name: "Mixed",
      stops: [
        { id: "s5", name: "E" },
        { id: "s6", name: "F" },
      ],
      observations: [
        { stopId: "s5", boardings: 110, alightings: 10, day: "mon" },
        { stopId: "s5", boardings: 90, alightings: 10, day: "sat" },
      ],
    });

    const ranked = rankRoutesByHealth([mixed, lowUse, healthy]);
    expect(ranked.map((r) => r.routeId)).toEqual(["r-healthy", "r-low", "r-mixed"]);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[2]?.rank).toBe(3);
    expect((ranked[0]?.score ?? 0) > (ranked[2]?.score ?? 100)).toBe(true);
  });

  it("treats insufficient-data as separate from low usage", () => {
    const insufficientButHighUse = makeRoute({
      id: "r-gap",
      name: "Coverage Gap",
      stops: [{ id: "s1", name: "Only" }],
      observations: [{ stopId: "s1", boardings: 300, alightings: 280, day: "mon" }],
    });

    const [report] = rankRoutesByHealth([insufficientButHighUse]);
    expect(report?.breakdown.insufficientDataStopRate).toBe(1);
    expect(report?.breakdown.lowActivityStopRate).toBe(0);
  });

  it("returns empty array when input is empty", () => {
    expect(rankRoutesByHealth([])).toEqual([]);
  });
});
