import {
  READINESS_ITEM_KEYS,
  type ReadinessChecklistItem,
  type ReadinessItem,
  type ReadinessItemKey,
  type ReadinessProgress,
} from "./types";

const readinessDefinitions: Record<
  ReadinessItemKey,
  { title: string; description: string }
> = {
  travel_documents: {
    title: "Travel documents",
    description: "Check your passport and required travel documents.",
  },
  flight_confirmation: {
    title: "Flight confirmation",
    description: "Make sure your flight booking is confirmed.",
  },
  accommodation: {
    title: "Accommodation",
    description: "Review your hotel or accommodation details.",
  },
  esim: {
    title: "eSIM",
    description: "Prepare mobile internet before arrival.",
  },
  local_transport: {
    title: "Local transport",
    description: "Plan transport from the airport and around the city.",
  },
  emergency_information: {
    title: "Emergency information",
    description: "Save useful contacts and important travel information.",
  },
};

export const READINESS_ITEMS: Array<{
  key: ReadinessItemKey;
  title: string;
  description: string;
}> = READINESS_ITEM_KEYS.map((key) => ({
  key,
  title: readinessDefinitions[key].title,
  description: readinessDefinitions[key].description,
}));

export function buildReadinessChecklist(
  savedItems: ReadinessItem[],
): ReadinessChecklistItem[] {
  const savedByKey = new Map(savedItems.map((item) => [item.itemKey, item]));

  return READINESS_ITEMS.map((definition) => {
    const saved = savedByKey.get(definition.key);

    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      completed: saved?.completedAt != null,
      completedAt: saved?.completedAt ?? null,
    };
  });
}

export function calculateReadinessProgress(
  items: ReadinessChecklistItem[],
): ReadinessProgress {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
