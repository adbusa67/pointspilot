import { InputHTMLAttributes, useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export default function Input({
  label,
  hint,
  id,
  className = "",
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hintId}
        className={
          "min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 " +
          "text-slate-100 placeholder:text-slate-500 backdrop-blur-md transition-colors " +
          "duration-200 focus:border-amex/60 focus:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-amex focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 " +
          className
        }
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
