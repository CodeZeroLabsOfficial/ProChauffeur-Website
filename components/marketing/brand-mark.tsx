import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export function BrandMark({ className, priority = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2.5 text-white", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-md object-cover"
        priority={priority}
      />
      <span className="font-heading text-xl tracking-tight">Elite Chauffeurs</span>
    </Link>
  );
}
