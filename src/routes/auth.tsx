import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { upsertProfile } from "@/lib/cloud";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] === "signup" ? "signup" : "login") as "login" | "signup",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Timely Substitution App" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Create a Timely account or log in to save your school timetable and daily substitution plans.",
      },
      { property: "og:title", content: "Sign in to Timely" },
      {
        property: "og:description",
        content: "Save your teacher timetable once and generate daily cover in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { tab: initialTab } = Route.useSearch();

  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState(() => `SCH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [studentPasscode, setStudentPasscode] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Accounts are unavailable right now. You can continue without an account.");
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  const signUp = async () => {
    if (!fullName.trim() || !schoolName.trim() || !schoolId.trim() || !studentPasscode.trim()) {
      setError("Complete your name, school name, School ID, and access passcode.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            school_name: schoolName,
            school_id: schoolId,
            student_passcode: studentPasscode,
            role,
          },
        },
      });
      if (err) throw err;
      if (data.session?.user) {
        await upsertProfile(data.session.user.id, { fullName, schoolName, schoolId, studentPasscode });
        navigate({ to: "/app", replace: true });
      } else {
        setNotice("Check your email to confirm your account, then log in.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  const logIn = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate({ to: "/app", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed. Please try again.");
    }
  };

  const forgot = async () => {
    if (!email) {
      setError("Enter your email first, then tap ‘Forgot password’.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setNotice("Password reset link sent — check your inbox.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page-shell">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <Logo size="md" />
          <span>Timely</span>
        </Link>

        <div className="auth-panel">
          <div className="auth-header">
            <p className="eyebrow">Welcome back</p>
            <h1>{role === "teacher" ? "Teacher access" : "Student access"}</h1>
          </div>

          <div className="role-toggle" aria-label="Select your role">
            <button
              type="button"
              className={role === "teacher" ? "active" : ""}
              onClick={() => setRole("teacher")}
            >
              Teacher
            </button>
            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => setRole("student")}
            >
              Student
            </button>
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "signup")} className="mt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3 pt-4">
              <Field id="li-name" label="Full name">
                <Input id="li-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </Field>
              <Field id="li-school" label="School name">
                <Input id="li-school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} autoComplete="organization" />
              </Field>
              <Field id="li-email" label="Email">
                <Input id="li-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="li-password" label="Password">
                <Input id="li-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Button className="w-full" disabled={busy} onClick={() => void logIn()}>
                {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Log in
              </Button>
              <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="auth-secondary-button w-full" onClick={() => void google()} disabled={busy}>
                Continue with Google
              </Button>
              <button type="button" onClick={() => void forgot()} className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline">
                Forgot password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 pt-4">
              <Field id="su-role" label="I am a">
                <div className="flex gap-2">
                  <Button type="button" variant={role === "teacher" ? "default" : "outline"} className="flex-1" onClick={() => setRole("teacher")}>
                    Teacher
                  </Button>
                  <Button type="button" variant={role === "student" ? "default" : "outline"} className="flex-1" onClick={() => setRole("student")}>
                    Student
                  </Button>
                </div>
              </Field>
              <Field id="su-name" label="Full name">
                <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </Field>
              <Field id="su-school" label="School name">
                <Input id="su-school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} autoComplete="organization" />
              </Field>
              <Field id="su-school-id" label="School ID">
                <Input id="su-school-id" value={schoolId} onChange={(e) => setSchoolId(e.target.value.toUpperCase())} autoComplete="organization" required />
              </Field>
              <Field id="su-student-passcode" label={role === "teacher" ? "Teacher access code" : "Student access code"}>
                <Input id="su-student-passcode" type="password" value={studentPasscode} onChange={(e) => setStudentPasscode(e.target.value)} autoComplete="new-password" required />
              </Field>
              <Field id="su-email" label="Email">
                <Input id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="su-password" label="Password">
                <Input id="su-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Button className="w-full" disabled={busy} onClick={() => void signUp()}>
                {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Create account
              </Button>
              <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="auth-secondary-button w-full" onClick={() => void google()} disabled={busy}>
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p className="mt-4 text-sm text-muted-foreground">{notice}</p>}
        </div>

        <p className="auth-footer-note">
          <Link to="/app">Continue without an account</Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
