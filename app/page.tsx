import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingServices } from "@/components/marketing/marketing-services";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <MarketingHero />
      <MarketingServices />
      <MarketingCta />
      <SiteFooter />
    </>
  );
}
