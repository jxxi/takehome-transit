import { Route } from "./types";

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
