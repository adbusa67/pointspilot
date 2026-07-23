import { LucideIcon } from "lucide-react";
import Card from "./Card";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  /** Accent colour (hex) used for the icon + left border. */
  accent: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-l-4 transition-colors duration-200 hover:border-white/20"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
          aria-hidden="true"
        >
          <Icon size={22} strokeWidth={2} />
        </span>
      </div>
    </Card>
  );
}
