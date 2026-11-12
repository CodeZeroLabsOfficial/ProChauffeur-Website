import { TripDetailView } from "@/components/dashboard/trip-detail-view";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { tripId } = await params;
  return <TripDetailView tripId={tripId} />;
}
