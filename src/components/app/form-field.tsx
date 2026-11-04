import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = React.ComponentProps<typeof Input> & { label: string; error?: string; hint?: ReactNode; containerClassName?: string };

/** Label + input + hint/error, wired up for screen readers. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, hint, id, containerClassName, ...props }, ref) => {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {error ? <p id={`${inputId}-error`} className="text-xs font-medium text-brick">{error}</p> : hint ? <p id={`${inputId}-hint`} className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
});
Field.displayName = "Field";

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type">>(({ label, error, hint, id, containerClassName, ...props }, ref) => {
  const generated = useId();
  const inputId = id ?? generated;
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input ref={ref} id={inputId} type={visible ? "text" : "password"} className="pr-12" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 my-auto grid h-9 w-10 place-items-center rounded-lg text-ink-muted hover:bg-sand hover:text-ink"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error ? <p id={`${inputId}-error`} className="text-xs font-medium text-brick">{error}</p> : hint ? <p id={`${inputId}-hint`} className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
});
PasswordField.displayName = "PasswordField";

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = { error: "border-brick/20 bg-brick-bg text-brick", success: "border-sage/20 bg-sage-bg text-sage", info: "border-plum/15 bg-plum-50 text-plum" };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-3.5 py-3 text-sm font-medium", styles[tone])}>
      {children}
    </div>
  );
}

/* Shared validators returning a human message, or undefined when valid. */
// eslint-disable-next-line react-refresh/only-export-components
export const validators = {
  required: (label: string) => (value: string) => (value.trim() ? undefined : `Please enter ${label}.`),
  name: (value: string) => (value.trim().length >= 2 ? undefined : "Please enter the full name (at least 2 letters)."),
  email: (value: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? undefined : "That doesn't look like an email address, e.g. name@school.in."),
  emailOrPhone: (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter your email or phone number.";
    if (trimmed.includes("@")) return validators.email(trimmed);
    return trimmed.replace(/\D/g, "").length >= 10 ? undefined : "Enter a 10-digit phone number or an email address.";
  },
  password: (value: string) => (value.length >= 8 ? undefined : "Use at least 8 characters."),
  passwordEntered: (value: string) => (value ? undefined : "Please enter your password."),
};
