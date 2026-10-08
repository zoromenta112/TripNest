import type { Metadata } from "next";

import { TripNestHeader } from "../../../../components/branding/tripnest-header";
import { ReadinessChecklist } from "../../../../features/readiness/components/readiness-checklist";
import { readinessCopy } from "../../../../features/readiness/copy";

export const metadata: Metadata = {
  title: readinessCopy.title,
};

type ReadinessPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function ReadinessPage({ params }: ReadinessPageProps) {
  const { tripId } = await params;

  return (
    <ReadinessChecklist
      tripId={tripId}
      header={
        <TripNestHeader
          title="Travel readiness"
          subtitle="Prepare everything before your trip."
        />
      }
    />
  );
}
