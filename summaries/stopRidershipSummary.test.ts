import type { Route } from "../types";
import { summarizeRouteStops } from "./index";

function singleStopRoute(observations: Route["observations"]): Route {
  return {
    id: "r-summary",
    name: "Summary Test Route",
    stops: [{ id: "s1", name: "Only Stop", lat: 40.0, lon: -74.0 }],
    observations,
  };
}

describe("summarizeRouteStops", () => {
  it("computes totals, net flow, and ordered observed days", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 30, alightings: 10, day: "wed" },
      { stopId: "s1", boardings: 20, alightings: 15, day: "mon" },
      { stopId: "s1", boardings: 25, alightings: 5, day: "tue" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.totalBoardings).toBe(75);
    expect(summary.totalAlightings).toBe(30);
    expect(summary.netFlow).toBe(45);
    expect(summary.daysObserved).toEqual(["mon", "tue", "wed"]);
  });

  it("classifies weekend-leisure when weekend activity dominates", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 20, alightings: 20, day: "fri" },
      { stopId: "s1", boardings: 120, alightings: 100, day: "sat" },
      { stopId: "s1", boardings: 90, alightings: 80, day: "sun" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend.kind).toBe("weekend-leisure");
    if (summary.trend.kind !== "insufficient-data") {
      expect(summary.trend.confidence).toBe("medium");
    }
  });

  it("classifies commuter-origin when weekday boardings dominate", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 120, alightings: 15, day: "mon" },
      { stopId: "s1", boardings: 110, alightings: 10, day: "tue" },
      { stopId: "s1", boardings: 105, alightings: 12, day: "wed" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend.kind).toBe("commuter-origin");
  });

  it("classifies commuter-destination when weekday alightings dominate", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 15, alightings: 100, day: "mon" },
      { stopId: "s1", boardings: 10, alightings: 120, day: "tue" },
      { stopId: "s1", boardings: 12, alightings: 95, day: "wed" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend.kind).toBe("commuter-destination");
  });

  it("classifies balanced when flow is near-even and consistent", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 50, alightings: 48, day: "mon" },
      { stopId: "s1", boardings: 52, alightings: 50, day: "tue" },
      { stopId: "s1", boardings: 49, alightings: 47, day: "wed" },
      { stopId: "s1", boardings: 51, alightings: 50, day: "thu" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend.kind).toBe("balanced");
    if (summary.trend.kind !== "insufficient-data") {
      expect(summary.trend.confidence).toBe("medium");
    }
  });

  it("classifies mixed when no stronger pattern applies", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 80, alightings: 10, day: "mon" },
      { stopId: "s1", boardings: 10, alightings: 80, day: "tue" },
      { stopId: "s1", boardings: 15, alightings: 10, day: "sat" },
      { stopId: "s1", boardings: 5, alightings: 20, day: "sun" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend.kind).toBe("mixed");
  });

  it("returns insufficient-data when fewer than two days are observed", () => {
    const route = singleStopRoute([
      { stopId: "s1", boardings: 10, alightings: 9, day: "mon" },
    ]);

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend).toEqual({ kind: "insufficient-data", reason: "fewer-than-2-days" });
  });

  it("returns insufficient-data when a stop has no observations", () => {
    const route: Route = {
      id: "r-empty-stop",
      name: "Empty Stop Route",
      stops: [{ id: "s1", name: "Only Stop", lat: 40.0, lon: -74.0 }],
      observations: [],
    };

    const [summary] = summarizeRouteStops(route);
    expect(summary.trend).toEqual({ kind: "insufficient-data", reason: "no-observations" });
  });

  it("returns one summary per declared stop", () => {
    const route: Route = {
      id: "r-multi",
      name: "Multi Stop Route",
      stops: [
        { id: "s1", name: "A", lat: 40.0, lon: -74.0 },
        { id: "s2", name: "B", lat: 40.1, lon: -74.1 },
      ],
      observations: [{ stopId: "s1", boardings: 10, alightings: 10, day: "mon" }],
    };

    const summaries = summarizeRouteStops(route);
    expect(summaries).toHaveLength(2);
    expect(summaries.map((s) => s.stopId)).toEqual(["s1", "s2"]);
  });
});
