import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFleet } from "@/components/marketing/marketing-fleet";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingInclusions } from "@/components/marketing/marketing-inclusions";
import { MarketingServices } from "@/components/marketing/marketing-services";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <MarketingHero />
      <MarketingServices />
      <MarketingFleet />
      <MarketingInclusions />
      <MarketingCta />
      <SiteFooter />
    </>
  );
}
