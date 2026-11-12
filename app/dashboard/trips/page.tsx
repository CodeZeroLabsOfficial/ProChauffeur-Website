import { ListPageHeader } from "@/components/dashboard/list-page-header";
import { TripsDataTable } from "@/components/dashboard/trips-data-table";

export default function DashboardTripsPage() {
  return (
    <>
      <ListPageHeader title="My Trips" description="Current and past bookings." />
      <TripsDataTable />
    </>
  );
}
