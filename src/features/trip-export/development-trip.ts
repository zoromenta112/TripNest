/**
 * Temporary trip details until Student 1's Trip model is integrated.
 * TODO: Replace this lookup with the shared Trip module. Do not create a trips table here.
 */
export const DEVELOPMENT_TRIP_ID = "11111111-1111-4111-8111-111111111111";

export type DevelopmentTrip = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  currency: string;
  bookingReferences: string[];
};

const developmentTrips: Record<string, DevelopmentTrip> = {
  [DEVELOPMENT_TRIP_ID]: {
    id: DEVELOPMENT_TRIP_ID,
    name: "Lisbon long weekend",
    origin: "Cairo",
    destination: "Lisbon",
    startDate: "2026-10-12",
    endDate: "2026-10-16",
    travelerCount: 2,
    currency: "EUR",
    bookingReferences: ["TN-DEMO-FLIGHT-1042", "TN-DEMO-STAY-220"],
  },
};

export function findDevelopmentTrip(tripId: string) {
  return developmentTrips[tripId] ?? null;
}
