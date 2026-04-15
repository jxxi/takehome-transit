import { validateFeed } from "./index";
import type { Route } from "../types";

const baseRoute = (): Route => ({
  id: "r1",
  name: "Test Route",
  stops: [
    { id: "s1", name: "Stop A", lat: 40.0, lon: -74.0 },
    { id: "s2", name: "Stop B", lat: 40.1, lon: -74.1 },
  ],
  observations: [
    { stopId: "s1", boardings: 50, alightings: 5, day: "mon" },
    { stopId: "s2", boardings: 5, alightings: 50, day: "mon" },
  ],
});

const issueKinds = (route: Route) =>
  validateFeed([route]).issues.map((i) => i.kind);

describe("validateFeed", () => {
  describe("valid feed", () => {
    it("returns valid:true and no issues for clean data", () => {
      const result = validateFeed([baseRoute()]);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("duplicate_route_id", () => {
    it("flags two routes with the same id", () => {
      const r1 = baseRoute();
      const r2 = { ...baseRoute(), name: "Other" };
      const result = validateFeed([r1, r2]);
      expect(result.issues.some((i) => i.kind === "duplicate_route_id")).toBe(true);
    });

    it("does not flag routes with distinct ids", () => {
      const r1 = baseRoute();
      const r2 = { ...baseRoute(), id: "r2", name: "Other" };
      expect(validateFeed([r1, r2]).issues).toHaveLength(0);
    });
  });

  describe("no_stops", () => {
    it("warns when a route has no stops", () => {
      const route: Route = { ...baseRoute(), stops: [], observations: [] };
      expect(issueKinds(route)).toContain("no_stops");
    });
  });

  describe("no_observations", () => {
    it("warns when a route has no observations", () => {
      const route: Route = { ...baseRoute(), observations: [] };
      expect(issueKinds(route)).toContain("no_observations");
    });
  });

  describe("orphan_observation", () => {
    it("errors when an observation references a stopId not in stops", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          ...baseRoute().observations,
          { stopId: "s9", boardings: 10, alightings: 10, day: "tue" },
        ],
      };
      const issues = validateFeed([route]).issues;
      expect(issues.some((i) => i.kind === "orphan_observation")).toBe(true);
      expect(validateFeed([route]).valid).toBe(false);
    });

    it("does not fire for known stopIds", () => {
      expect(issueKinds(baseRoute())).not.toContain("orphan_observation");
    });
  });

  describe("negative_counts", () => {
    it("errors on negative boardings", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: -5, alightings: 10, day: "mon" },
          { stopId: "s2", boardings: 5, alightings: 50, day: "mon" },
        ],
      };
      const issues = validateFeed([route]).issues;
      expect(issues.some((i) => i.kind === "negative_counts")).toBe(true);
      expect(validateFeed([route]).valid).toBe(false);
    });

    it("errors on negative alightings", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: 50, alightings: -3, day: "mon" },
          { stopId: "s2", boardings: 5, alightings: 50, day: "mon" },
        ],
      };
      expect(issueKinds(route)).toContain("negative_counts");
    });
  });

  describe("invalid_coordinates", () => {
    it("errors when lat is out of range", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          { id: "s1", name: "Stop A", lat: 95, lon: -74.0 },
          { id: "s2", name: "Stop B", lat: 40.1, lon: -74.1 },
        ],
      };
      expect(issueKinds(route)).toContain("invalid_coordinates");
      expect(validateFeed([route]).valid).toBe(false);
    });

    it("errors when lon is out of range", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          { id: "s1", name: "Stop A", lat: 40.0, lon: 200 },
          { id: "s2", name: "Stop B", lat: 40.1, lon: -74.1 },
        ],
      };
      expect(issueKinds(route)).toContain("invalid_coordinates");
    });

    it("accepts boundary values (-90, 90, -180, 180)", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          { id: "s1", name: "Stop A", lat: -90, lon: -180 },
          { id: "s2", name: "Stop B", lat: 90, lon: 180 },
        ],
      };
      expect(issueKinds(route)).not.toContain("invalid_coordinates");
    });
  });

  describe("duplicate_stop_id", () => {
    it("warns when the same stop id appears twice in a route", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          { id: "s1", name: "Stop A", lat: 40.0, lon: -74.0 },
          { id: "s1", name: "Stop A copy", lat: 40.1, lon: -74.1 },
        ],
      };
      expect(issueKinds(route)).toContain("duplicate_stop_id");
    });
  });

  describe("duplicate_observation", () => {
    it("warns when two observations share the same (stopId, day)", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: 50, alightings: 5, day: "mon" },
          { stopId: "s1", boardings: 60, alightings: 6, day: "mon" },
          { stopId: "s2", boardings: 5, alightings: 50, day: "mon" },
        ],
      };
      expect(issueKinds(route)).toContain("duplicate_observation");
    });

    it("does not warn for same stop on different days", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: 50, alightings: 5, day: "mon" },
          { stopId: "s1", boardings: 60, alightings: 6, day: "tue" },
          { stopId: "s2", boardings: 5, alightings: 50, day: "mon" },
        ],
      };
      expect(issueKinds(route)).not.toContain("duplicate_observation");
    });
  });

  describe("duplicate_stop_coordinates", () => {
    it("warns when two different stops share lat/lon within the same route", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          { id: "s1", name: "Stop A", lat: 40.0, lon: -74.0 },
          { id: "s2", name: "Stop B", lat: 40.0, lon: -74.0 },
        ],
      };
      expect(issueKinds(route)).toContain("duplicate_stop_coordinates");
    });

    it("does not warn when coords are unique", () => {
      expect(issueKinds(baseRoute())).not.toContain("duplicate_stop_coordinates");
    });
  });

  describe("inactive_stop", () => {
    it("warns when a stop has no observations at all", () => {
      const route: Route = {
        ...baseRoute(),
        stops: [
          ...baseRoute().stops,
          { id: "s3", name: "Ghost Stop", lat: 40.2, lon: -74.2 },
        ],
      };
      expect(issueKinds(route)).toContain("inactive_stop");
    });

    it("does not warn for stops that have observations", () => {
      expect(issueKinds(baseRoute())).not.toContain("inactive_stop");
    });
  });

  describe("route_flow_imbalance", () => {
    it("warns when boardings and alightings are more than 10% apart", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: 100, alightings: 0, day: "mon" },
          { stopId: "s2", boardings: 100, alightings: 0, day: "mon" },
        ],
      };
      expect(issueKinds(route)).toContain("route_flow_imbalance");
    });

    it("does not warn when flow is balanced within 10%", () => {
      const route: Route = {
        ...baseRoute(),
        observations: [
          { stopId: "s1", boardings: 105, alightings: 5, day: "mon" },
          { stopId: "s2", boardings: 0, alightings: 100, day: "mon" },
        ],
      };
      expect(issueKinds(route)).not.toContain("route_flow_imbalance");
    });

    it("does not warn when there are no observations (zero volume)", () => {
      const route: Route = { ...baseRoute(), observations: [] };
      expect(issueKinds(route)).not.toContain("route_flow_imbalance");
    });
  });

  describe("sample feed data", () => {
    it("catches orphan observations", async () => {
      const { feed } = await import("../feed");
      const result = validateFeed(feed);
      const orphan = result.issues.find(
        (i) => i.kind === "orphan_observation" && "stopId" in i && i.stopId === "s9"
      );
      expect(orphan).toBeDefined();
    });
  });
});
