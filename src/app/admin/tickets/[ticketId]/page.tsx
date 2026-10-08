import { TripNestHeader } from "../../../../components/branding/tripnest-header";
import { AdminTicketDetail } from "../../../../features/support/components/admin-ticket-detail";

type AdminTicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

export default async function AdminTicketPage({ params }: AdminTicketPageProps) {
  const { ticketId } = await params;
  return (
    <AdminTicketDetail
      ticketId={ticketId}
      header={
        <TripNestHeader
          title="Admin ticket details"
          subtitle="Manage the support workflow and updates."
        />
      }
    />
  );
}
