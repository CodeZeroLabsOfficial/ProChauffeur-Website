import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFeatures } from "@/components/marketing/marketing-features";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function HomePage() {
  return (
    <>
      <MarketingHero />
      <MarketingFeatures />
      <MarketingCta />
      <SiteFooter />
    </>
  );
}
