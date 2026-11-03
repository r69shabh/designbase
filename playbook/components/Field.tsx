import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, className = "", ...props }: FieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="font-body text-sm font-medium text-ink">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${id}-note` : undefined}
        className={`h-12 rounded-md border bg-paper px-3 font-body text-base text-ink placeholder:text-ink-3 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent ${error ? "border-brick" : "border-line"}`}
        {...props}
      />
      {(error || hint) && (
        <p id={`${id}-note`} className={`font-body text-sm ${error ? "text-brick" : "text-ink-3"}`}>{error ?? hint}</p>
      )}
    </div>
  );
}
