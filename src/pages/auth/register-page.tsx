import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, Loader2, MailCheck, School, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field, FormAlert, PasswordField, validators } from "@/components/app/form-field";
import { SchoolPicker } from "@/components/app/school-picker";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPublicClasses, registerForRole, verifyOtp, type PublicClassSection, type PublicSchool } from "@/lib/auth-api";
import { ME_KEY } from "@/lib/session";
import { cn } from "@/lib/utils";
import { AuthLayout } from "./auth-layout";

type Kind = "school" | "teacher" | "student";
type Step = "details" | "verify" | "done";

const KINDS: Array<{ value: Kind; label: string; icon: typeof School; title: string; subtitle: string }> = [
  { value: "school", label: "School", icon: School, title: "Register your school", subtitle: "Set up ClassSync for your school. You'll be the administrator." },
  { value: "teacher", label: "Teacher", icon: Users, title: "Join as a teacher", subtitle: "Create your account. Your school office approves it before you can sign in." },
  { value: "student", label: "Student", icon: GraduationCap, title: "Join as a student", subtitle: "Create your account. Your school approves it before you can sign in." },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<Kind>("school");
  const [step, setStep] = useState<Step>("details");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState<PublicSchool | null>(null);
  const [classes, setClasses] = useState<PublicClassSection[]>([]);
  const [classId, setClassId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    setClassId("");
    if (kind !== "student" || !school) { setClasses([]); return; }
    void getPublicClasses(school._id).then((items) => setClasses([...items].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section)))).catch(() => setClasses([]));
  }, [kind, school]);

  const meta = KINDS.find((item) => item.value === kind)!;

  const errors: Record<string, string | undefined> = {
    schoolName: kind === "school" ? (schoolName.trim().length >= 2 ? undefined : "Please enter your school's name.") : undefined,
    city: kind === "school" ? (city.trim().length >= 2 ? undefined : "Please enter the city or town.") : undefined,
    name: validators.name(name),
    email: kind !== "student" ? validators.email(email) : undefined,
    school: kind !== "school" && !school ? "Choose your school from the list." : undefined,
    classId: kind === "student" && !classId ? "Choose your class and section." : undefined,
    rollNo: kind === "student" ? validators.required("your admission or roll number")(rollNo) : undefined,
    password: validators.password(password),
  };
  const show = (key: string) => (touched ? errors[key] : undefined);

  const switchKind = (value: Kind) => {
    setKind(value);
    setStep("details");
    setTouched(false);
    setError(null);
    setDevCode(null);
    setCode("");
  };

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    try {
      if (kind === "school") {
        const result = await registerForRole("school", { name: schoolName.trim(), city: city.trim(), adminName: name.trim(), adminEmail: email.trim(), password });
        setDevCode(result.devCode ?? null);
        setStep("verify");
      } else if (kind === "teacher") {
        const result = await registerForRole("teacher", { schoolId: school!._id, name: name.trim(), email: email.trim(), password });
        setDevCode(result.devCode ?? null);
        setStep("verify");
      } else {
        await registerForRole("student", { schoolId: school!._id, classSectionId: classId, name: name.trim(), admissionNumber: rollNo.trim(), password });
        setStep("done");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn't create the account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) { setError("Enter all 6 digits of the code."); return; }
    setBusy(true);
    try {
      await verifyOtp(email.trim(), code);
      if (kind === "school") {
        await queryClient.invalidateQueries({ queryKey: ME_KEY });
        navigate("/admin/dashboard", { replace: true });
      } else {
        setStep("done");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "That code didn't work. Please check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <AuthLayout title="You're all set" subtitle="Thanks for joining ClassSync.">
        <div className="rounded-2xl border border-line bg-paper p-6 text-center shadow-soft">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-bg text-sage"><CheckCircle2 className="h-7 w-7" /></span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">Waiting for your school's approval</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {school?.name ?? "Your school"} will review your account. Once it's approved you can sign in with {kind === "student" ? "your admission number" : "your email"} and password.
          </p>
          <Button asChild className="mt-6"><Link to="/login">Go to sign in</Link></Button>
        </div>
      </AuthLayout>
    );
  }

  if (step === "verify") {
    return (
      <AuthLayout title="Check your email" subtitle={<>We sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>.</>}>
        <form noValidate onSubmit={(event) => void submitCode(event)} className="space-y-5">
          {devCode ? (
            <FormAlert tone="info">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>Demo mode: your code is <span className="tabular font-bold tracking-widest">{devCode}</span></span>
                <button type="button" className="rounded-full bg-plum px-3 py-1 text-xs font-semibold text-cream" onClick={() => setCode(devCode)}>Fill it in</button>
              </span>
            </FormAlert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <InputOTP id="otp" maxLength={6} value={code} onChange={setCode} inputMode="numeric" autoFocus containerClassName="justify-start">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} />)}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-ink-muted">The code expires in 10 minutes.</p>
          </div>
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="animate-spin" />Checking…</> : kind === "school" ? "Verify and open my school" : "Verify my email"}
          </Button>
          <button type="button" onClick={() => { setStep("details"); setError(null); }} className="w-full text-center text-sm font-semibold text-ink-muted hover:text-ink">
            <MailCheck className="mr-1.5 inline h-4 w-4" />Wrong email? Go back
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={meta.title} subtitle={meta.subtitle}>
      <div role="tablist" aria-label="Account type" className="grid grid-cols-3 gap-2">
        {KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={kind === value}
            onClick={() => switchKind(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-semibold transition-colors",
              kind === value ? "border-plum bg-plum-50 text-plum" : "border-line-strong bg-paper text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />{label}
          </button>
        ))}
      </div>

      <form noValidate onSubmit={(event) => void submitDetails(event)} className="mt-6 space-y-4">
        {kind === "school" ? (
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <Field label="School name" autoComplete="organization" placeholder="e.g. Sunrise Public School" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} error={show("schoolName")} />
            <Field label="City" autoComplete="address-level2" placeholder="e.g. Jaipur" value={city} onChange={(event) => setCity(event.target.value)} error={show("city")} />
          </div>
        ) : (
          <SchoolPicker value={school} onChange={setSchool} error={show("school")} />
        )}

        <Field label={kind === "school" ? "Your name (principal or admin)" : "Full name"} autoComplete="name" placeholder={kind === "student" ? "e.g. Aarohi Gupta" : "e.g. Ananya Sharma"} value={name} onChange={(event) => setName(event.target.value)} error={show("name")} />

        {kind === "student" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-section">Class &amp; section</Label>
              <Select value={classId} onValueChange={setClassId} disabled={!school}>
                <SelectTrigger id="class-section" aria-invalid={show("classId") ? true : undefined}>
                  <SelectValue placeholder={school ? "Choose class" : "Choose school first"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.grade}-{item.section}{item.stream ? ` · ${item.stream}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
              {show("classId") ? <p className="text-xs font-medium text-brick">{show("classId")}</p> : null}
            </div>
            <Field label="Admission / roll no." placeholder="e.g. A1042" value={rollNo} onChange={(event) => setRollNo(event.target.value.toUpperCase())} error={show("rollNo")} />
          </div>
        ) : (
          <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="name@school.in" value={email} onChange={(event) => setEmail(event.target.value)} error={show("email")} hint="We'll send a 6-digit code to confirm it." />
        )}

        <PasswordField label="Create a password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} error={show("password")} />

        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="animate-spin" />Please wait…</> : kind === "student" ? "Create my account" : "Continue"}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          By continuing you agree to our <Link to="/terms" className="font-semibold text-plum hover:underline">terms</Link> and <Link to="/privacy" className="font-semibold text-plum hover:underline">privacy notes</Link>.
        </p>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="font-semibold text-plum hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
