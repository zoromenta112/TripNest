import { TripNestHeader } from "../../../components/branding/tripnest-header";
import { AdminTicketBoard } from "../../../features/support/components/admin-ticket-board";

export default function AdminTicketsPage() {
  return (
    <AdminTicketBoard
      header={
        <TripNestHeader
          title="Admin Support Dashboard"
          subtitle="Review and manage traveler support requests."
        />
      }
    />
  );
}
