import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFeatures } from "@/components/marketing/marketing-features";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <MarketingHero />
      <MarketingFeatures />
      <MarketingCta />
      <SiteFooter />
    </>
  );
}
