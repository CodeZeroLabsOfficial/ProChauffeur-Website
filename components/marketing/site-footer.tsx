import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border bg-background border-t px-4 py-10 sm:px-6">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-heading text-foreground text-base">Elite Chauffeurs</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/fleet" className="hover:text-foreground transition-colors">
            Fleet
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <Link href="/booking" className="hover:text-foreground transition-colors">
            Book
          </Link>
        </nav>
      </div>
    </footer>
  );
}
