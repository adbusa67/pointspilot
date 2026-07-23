import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-colors duration-200 ease-out cursor-pointer select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-base-900 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-amex text-white hover:bg-[#0059a6] focus-visible:ring-amex shadow-lg shadow-amex/20",
  secondary:
    "glass text-slate-100 hover:bg-white/10 focus-visible:ring-white/40",
  danger:
    "bg-aeroplan text-white hover:bg-[#c10f1f] focus-visible:ring-aeroplan shadow-lg shadow-aeroplan/20",
  ghost:
    "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 focus-visible:ring-white/30",
};

// Minimum 44px touch targets (ui-ux-pro-max accessibility guideline).
const sizes: Record<Size, string> = {
  md: "min-h-[44px] px-5 py-2.5 text-sm",
  lg: "min-h-[48px] px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
