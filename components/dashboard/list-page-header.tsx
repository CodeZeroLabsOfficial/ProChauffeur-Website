import type { ReactNode } from "react";

type ListPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function ListPageHeader({ title, description, actions }: ListPageHeaderProps) {
  return (
    <div className="mb-4 flex flex-row items-center justify-between gap-3 sm:mb-6">
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight lg:text-2xl">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
