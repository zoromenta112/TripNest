export type TripSummaryStatusCount = {
  status: "open" | "in_progress" | "resolved" | "closed";
  label: string;
  count: number;
};

export type TripSummary = {
  tripName: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  currency: string;
  bookingReferences: string[];
  readiness: {
    completed: number;
    total: number;
    percentage: number;
  };
  support: {
    total: number;
    byStatus: TripSummaryStatusCount[];
  };
};
