import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, School, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Field, FormAlert, PasswordField, validators } from "@/components/app/form-field";
import { SchoolPicker } from "@/components/app/school-picker";
import { Button } from "@/components/ui/button";
import { isPathAllowedForRole } from "@/lib/access";
import { ApiError, DEMO_ACCOUNTS, appRoleFromUser, homePathFor, login, type PublicSchool } from "@/lib/auth-api";
import { ME_KEY } from "@/lib/session";
import { cn } from "@/lib/utils";
import { AuthLayout } from "./auth-layout";

type Mode = "staff" | "student";
type DemoKey = keyof typeof DEMO_ACCOUNTS;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<Mode>("staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState<PublicSchool | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"form" | DemoKey | null>(null);

  const errors = {
    identifier: mode === "staff" ? validators.emailOrPhone(identifier) : validators.required("your admission number")(identifier),
    password: validators.passwordEntered(password),
    school: mode === "student" && !school ? "Choose your school from the list." : undefined,
  };
  const show = (key: keyof typeof errors) => (touched ? errors[key] : undefined);

  const finish = async (user: Awaited<ReturnType<typeof login>>) => {
    await queryClient.invalidateQueries({ queryKey: ME_KEY });
    const role = appRoleFromUser(user);
    navigate(from && isPathAllowedForRole(from, role) && from !== "/login" ? from : homePathFor(role), { replace: true });
  };

  const describe = (requestError: unknown) => {
    if (requestError instanceof ApiError && requestError.code === "PENDING_APPROVAL") return "Your account is waiting for approval from your school. You'll be able to sign in once the office approves it.";
    return requestError instanceof Error ? requestError.message : "We couldn't sign you in. Please try again.";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    setBusy("form");
    try {
      await finish(await login({ role: mode, identifier: identifier.trim(), password, ...(mode === "student" ? { schoolId: school!._id } : {}) }));
    } catch (requestError) {
      setError(describe(requestError));
    } finally {
      setBusy(null);
    }
  };

  const tryDemo = async (key: DemoKey) => {
    const account = DEMO_ACCOUNTS[key];
    setError(null);
    setBusy(key);
    try {
      await finish(await login({ role: account.role, identifier: account.identifier, password: account.password, ...("schoolId" in account ? { schoolId: account.schoolId } : {}) }));
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 0
          ? requestError.message
          : import.meta.env.DEV
            ? "The demo school isn't ready yet. Make sure the API is running (npm run dev) and try again."
            : "The sample school is unavailable right now. Please try again in a minute.",
      );
    } finally {
      setBusy(null);
    }
  };

  const demoButtons: Array<{ key: DemoKey; icon: typeof School; hint: string }> = [
    { key: "admin", icon: School, hint: "Run the school day" },
    { key: "teacher", icon: Users, hint: "See duties & routine" },
    { key: "student", icon: GraduationCap, hint: "Check today's classes" },
  ];

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your school's ClassSync.">
      <section aria-labelledby="demo-title" className="rounded-2xl border border-plum/15 bg-plum-50/70 p-4">
        <h2 id="demo-title" className="text-sm font-semibold text-ink">Exploring ClassSync? Use the sample school</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {demoButtons.map(({ key, icon: Icon, hint }) => (
            <button
              key={key}
              type="button"
              onClick={() => void tryDemo(key)}
              disabled={busy !== null}
              aria-label={`Try as ${DEMO_ACCOUNTS[key].label}`}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-line bg-paper px-2 py-3 text-center transition-[border-color,box-shadow] hover:border-plum/40 hover:shadow-soft disabled:opacity-60"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-peach-100 text-plum group-hover:bg-plum group-hover:text-cream">
                {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="text-[13px] font-semibold leading-tight text-ink">Try as {DEMO_ACCOUNTS[key].label}</span>
              <span className="hidden text-2xs leading-tight text-ink-muted xs:block">{hint}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
        <span className="h-px flex-1 bg-line" />or sign in with your account<span className="h-px flex-1 bg-line" />
      </div>

      <div role="tablist" aria-label="Who is signing in" className="grid grid-cols-2 gap-1 rounded-full border border-line bg-sand/70 p-1">
        {(["staff", "student"] as Mode[]).map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => { setMode(value); setTouched(false); setError(null); setIdentifier(""); }}
            className={cn("rounded-full py-2 text-sm font-semibold transition-colors", mode === value ? "bg-paper text-ink shadow-xs" : "text-ink-muted hover:text-ink")}
          >
            {value === "staff" ? "Staff" : "Student"}
          </button>
        ))}
      </div>

      <form noValidate onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
        {mode === "student" ? <SchoolPicker value={school} onChange={setSchool} error={show("school")} /> : null}
        <Field
          label={mode === "staff" ? "Email or phone" : "Admission number"}
          autoComplete={mode === "staff" ? "username" : "off"}
          inputMode={mode === "staff" ? "email" : "text"}
          placeholder={mode === "staff" ? "name@school.in or 98765 43210" : "e.g. A1042"}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          onBlur={() => identifier && setTouched(true)}
          error={show("identifier")}
        />
        <PasswordField label="Password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} error={show("password")} />
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy !== null}>
          {busy === "form" ? <><Loader2 className="animate-spin" />Signing in…</> : "Sign in"}
        </Button>
        <p className="text-center text-sm text-ink-muted">Forgot your password? Ask your school office to reset it.</p>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-ink-muted">
        New to ClassSync? <Link to="/register" className="font-semibold text-plum hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
