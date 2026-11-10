import { FareEstimateView } from "@/components/booking/fare-estimate-view";
import { BookingChrome } from "@/components/booking/booking-chrome";

type BookPageProps = {
  searchParams: Promise<{
    pickup?: string;
    dropoff?: string;
    scheduledPickupAt?: string;
    scheduledReturnAt?: string;
    itinerary?: string;
    tripType?: string;
    hourlyHours?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const hourlyHours = params.hourlyHours ? Number(params.hourlyHours) : undefined;

  return (
    <BookingChrome step="estimate" backHref="/">
      <FareEstimateView
        seed={{
          pickupText: params.pickup,
          dropoffText: params.dropoff,
          scheduledPickupAt: params.scheduledPickupAt,
          scheduledReturnAt: params.scheduledReturnAt,
          itinerary: params.itinerary === "return" ? "return" : "oneWay",
          tripType: params.tripType === "hourly" ? "hourly" : "transfer",
          hourlyHours:
            typeof hourlyHours === "number" && Number.isFinite(hourlyHours)
              ? hourlyHours
              : undefined
        }}
      />
    </BookingChrome>
  );
}
