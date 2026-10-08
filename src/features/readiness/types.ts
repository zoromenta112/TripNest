export const READINESS_ITEM_KEYS = [
  "travel_documents",
  "flight_confirmation",
  "accommodation",
  "esim",
  "local_transport",
  "emergency_information",
] as const;

export type ReadinessItemKey = (typeof READINESS_ITEM_KEYS)[number];

export type ReadinessItem = {
  id: string;
  tripId: string;
  itemKey: ReadinessItemKey;
  completedAt: string | null;
};

export type ReadinessChecklistItem = {
  key: ReadinessItemKey;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
};

export type ReadinessProgress = {
  completed: number;
  total: number;
  percentage: number;
};