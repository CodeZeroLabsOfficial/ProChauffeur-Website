"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function defaultPickupLocalValue() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HeroBookingStrip() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [scheduledPickupAt, setScheduledPickupAt] = useState(defaultPickupLocalValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (dropoff.trim()) params.set("dropoff", dropoff.trim());
    if (scheduledPickupAt) {
      params.set("scheduledPickupAt", new Date(scheduledPickupAt).toISOString());
    }
    const query = params.toString();
    router.push(query ? `/book?${query}` : "/book");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-hero-strip w-full max-w-4xl border border-white/20 bg-black/35 p-3 backdrop-blur-md sm:p-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-0">
        <div className="border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0">
          <Label htmlFor="hero-pickup" className="text-xs font-medium text-white/70">
            Pickup
          </Label>
          <Input
            id="hero-pickup"
            name="pickup"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Pickup address"
            className="h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0">
          <Label htmlFor="hero-dropoff" className="text-xs font-medium text-white/70">
            Drop-off
          </Label>
          <Input
            id="hero-dropoff"
            name="dropoff"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="Drop-off address"
            className="h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="min-w-0 flex-1 px-3 py-2">
          <Label htmlFor="hero-pickup-at" className="text-xs font-medium text-white/70">
            Pickup time
          </Label>
          <Input
            id="hero-pickup-at"
            name="scheduledPickupAt"
            type="datetime-local"
            value={scheduledPickupAt}
            onChange={(e) => setScheduledPickupAt(e.target.value)}
            className="h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none focus-visible:ring-0 dark:bg-transparent [color-scheme:dark]"
          />
        </div>
        <div className="px-1 pb-1 sm:pb-0 sm:pl-2">
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-white px-6 text-neutral-950 hover:bg-white/90 sm:w-auto">
            Get estimate
          </Button>
        </div>
      </div>
    </form>
  );
}
