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
    adults?: string;
    children?: string;
  }>;
};

function parseCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.floor(value);
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const hourlyHours = params.hourlyHours ? Number(params.hourlyHours) : undefined;
  const passengers = parseCount(params.passengers);
  const adults = parseCount(params.adults);
  const children = parseCount(params.children);

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
            typeof passengers === "number" && passengers >= 1
              ? Math.min(8, passengers)
              : undefined,
          adults: typeof adults === "number" && adults >= 1 ? Math.min(8, adults) : undefined,
          children:
            typeof children === "number" && children >= 0 ? Math.min(8, children) : undefined
        }}
      />
    </BookingChrome>
  );
}
