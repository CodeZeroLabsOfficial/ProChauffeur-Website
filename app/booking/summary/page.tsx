import { SummaryView } from "@/components/booking/summary-view";
import { BookingChrome } from "@/components/booking/booking-chrome";

export default function BookSummaryPage() {
  return (
    <BookingChrome step="summary" showTripStrip embedStepsInContent>
      <SummaryView />
    </BookingChrome>
  );
}
