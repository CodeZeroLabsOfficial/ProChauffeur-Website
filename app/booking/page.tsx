import { FareEstimateView } from "@/components/booking/fare-estimate-view";
import { BookingChrome } from "@/components/booking/booking-chrome";

type BookPageProps = {
  searchParams: Promise<{
    pickup?: string;
    dropoff?: string;
    scheduledPickupAt?: string;
    scheduledReturnAt?: string;
    itinerary?: string;
    serviceType?: string;
    hourlyHours?: string;
    passengers?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const hourlyHours = params.hourlyHours ? Number(params.hourlyHours) : undefined;
  const passengers = params.passengers ? Number(params.passengers) : undefined;

  return (
    <BookingChrome step="estimate" showTripStrip embedStepsInContent>
      <FareEstimateView
        seed={{
          pickupText: params.pickup,
          dropoffText: params.dropoff,
          scheduledPickupAt: params.scheduledPickupAt,
          scheduledReturnAt: params.scheduledReturnAt,
          itinerary: params.itinerary === "return" ? "return" : "oneWay",
          serviceType: params.serviceType === "hourly" ? "hourly" : "transfer",
          hourlyHours:
            typeof hourlyHours === "number" && Number.isFinite(hourlyHours)
              ? hourlyHours
              : undefined,
          passengers:
            typeof passengers === "number" && Number.isFinite(passengers) && passengers >= 1
              ? Math.min(8, Math.floor(passengers))
              : undefined
        }}
      />
    </BookingChrome>
  );
}
