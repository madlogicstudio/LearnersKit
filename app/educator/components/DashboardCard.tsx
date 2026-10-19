import type { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
}: DashboardCardProps) => {
    return (
        <div className="font-sans min-w-0 rounded-xl bg-card p-5 flex flex-col gap-4 transition-colors hover:bg-muted/30
            bg-white dark:bg-[var(--card)]">
            <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-medium text-foreground/70">
                    {title}
                </span>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                    <Icon
                        size={24}
                        className="text-[var(--primary)]"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {value}
                </span>

                <span className="text-md text-foreground/60">
                    {description}
                </span>
            </div>
        </div>
    );
};
