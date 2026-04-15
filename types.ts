export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Stop = Readonly<{
  id: string;
  name: string;
  lat: number;
  lon: number;
}>;

export type RidershipObservation = Readonly<{
  stopId: string;
  boardings: number;
  alightings: number;
  day: DayOfWeek;
}>;

export type Route = Readonly<{
  id: string;
  name: string;
  stops: readonly Stop[];
  observations: readonly RidershipObservation[];
}>;
