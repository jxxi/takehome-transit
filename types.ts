export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type RidershipObservation = {
  stopId: string;
  boardings: number;
  alightings: number;
  day: DayOfWeek;
};

export type Route = {
  id: string;
  name: string;
  stops: Stop[];
  observations: RidershipObservation[];
};
