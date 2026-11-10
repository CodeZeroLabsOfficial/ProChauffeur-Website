const FEATURES = [
  {
    title: "Airport and city transfers",
    body: "Point-to-point journeys with clear pickup timing and vehicle class choice."
  },
  {
    title: "Transparent fare estimates",
    body: "See the quote before you book, including add-ons that fit your trip."
  },
  {
    title: "Return trips when you need them",
    body: "Book one-way or return in the same flow, with schedule and passenger details."
  }
] as const;

export function MarketingFeatures() {
  return (
    <section id="features" className="bg-background scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl tracking-tight text-balance sm:text-4xl">
            Built for reliable private travel
          </h2>
          <p className="text-muted-foreground mt-3 text-base text-balance sm:text-lg">
            From the first estimate to confirmation, the booking path matches how you already book
            in the app.
          </p>
        </div>
        <ul className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="space-y-3">
              <h3 className="text-lg font-medium tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-balance sm:text-base">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
