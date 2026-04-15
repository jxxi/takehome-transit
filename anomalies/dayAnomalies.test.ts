import type { Route } from "../types";
import { detectDayAnomalies } from "./index";

function makeRoute(input: {
  id: string;
  name: string;
  observations: Route["observations"];
}): Route {
  return {
    id: input.id,
    name: input.name,
    stops: [{ id: "s1", name: "Stop A", lat: 40.0, lon: -74.0 }],
    observations: input.observations,
  };
}

describe("detectDayAnomalies", () => {
  it("detects a high anomaly day", () => {
    const route = makeRoute({
      id: "r1",
      name: "High Spike Route",
      observations: [
        { stopId: "s1", boardings: 50, alightings: 50, day: "mon" }, // 100
        { stopId: "s1", boardings: 50, alightings: 50, day: "tue" }, // 100
        { stopId: "s1", boardings: 150, alightings: 150, day: "wed" }, // 300
      ],
    });

    const [report] = detectDayAnomalies([route], 0.6);
    expect(report?.anomalies).toHaveLength(1);
    expect(report?.anomalies[0]?.day).toBe("wed");
    expect(report?.anomalies[0]?.direction).toBe("high");
  });

  it("detects a low anomaly day", () => {
    const route = makeRoute({
      id: "r2",
      name: "Low Dip Route",
      observations: [
        { stopId: "s1", boardings: 10, alightings: 10, day: "mon" }, // 20
        { stopId: "s1", boardings: 60, alightings: 60, day: "tue" }, // 120
        { stopId: "s1", boardings: 60, alightings: 60, day: "wed" }, // 120
      ],
    });

    const [report] = detectDayAnomalies([route], 0.6);
    expect(report?.anomalies).toHaveLength(1);
    expect(report?.anomalies[0]?.day).toBe("mon");
    expect(report?.anomalies[0]?.direction).toBe("low");
  });

  it("returns no anomalies for a normal distribution at default threshold", () => {
    const route = makeRoute({
      id: "r3",
      name: "Normal Route",
      observations: [
        { stopId: "s1", boardings: 50, alightings: 48, day: "mon" }, // 98
        { stopId: "s1", boardings: 52, alightings: 51, day: "tue" }, // 103
        { stopId: "s1", boardings: 49, alightings: 50, day: "wed" }, // 99
      ],
    });

    const [report] = detectDayAnomalies([route]);
    expect(report?.anomalies).toHaveLength(0);
    expect(report?.reasonNoDetection).toBeUndefined();
  });

  it("returns insufficient-days reason when fewer than two days observed", () => {
    const route = makeRoute({
      id: "r4",
      name: "Sparse Route",
      observations: [{ stopId: "s1", boardings: 100, alightings: 90, day: "mon" }],
    });

    const [report] = detectDayAnomalies([route]);
    expect(report?.reasonNoDetection).toBe("insufficient-days");
    expect(report?.anomalies).toHaveLength(0);
  });

  it("returns zero-variance reason when all day totals are identical", () => {
    const route = makeRoute({
      id: "r5",
      name: "Flat Route",
      observations: [
        { stopId: "s1", boardings: 50, alightings: 50, day: "mon" }, // 100
        { stopId: "s1", boardings: 55, alightings: 45, day: "tue" }, // 100
        { stopId: "s1", boardings: 60, alightings: 40, day: "wed" }, // 100
      ],
    });

    const [report] = detectDayAnomalies([route]);
    expect(report?.reasonNoDetection).toBe("zero-variance");
    expect(report?.anomalies).toHaveLength(0);
  });
});
