import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Inbox,
  LockKeyhole,
  Loader2,
  Printer,
  ShieldCheck,
  Shuffle,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { isPathAllowedForRole, type AppRole } from "./lib/access";
import { appRoleFromUser, getCurrentUser, login as loginWithDatabase, registerSchoolAccount, registerForRole, searchSchools, getPublicClasses, verifyOtp, type PublicSchool, type PublicClassSection } from "./lib/auth-api";

import { LandingPage } from "./pages/landing-page";
import { LegalPage } from "./pages/legal-page";
import { SchedulePage } from "./pages/schedule-page";


type FeatureCard = {
  title: string;
  copy: string;
  icon: "calendar" | "shuffle" | "inbox" | "graduate" | "printer" | "offline";
};

const publicStats = [
  { label: "0 clashes", value: "0", detail: "validated timetable conflicts" },
  { label: "Under 5s", value: "< 5s", detail: "substitute planning in a live school day" },
  { label: "100% covered", value: "100%", detail: "assignment tracking for all periods" },
];

const featureCards: FeatureCard[] = [
  { title: "Auto-generated timetable", copy: "Build a clash-free master schedule in moments using teacher, class and subject constraints.", icon: "calendar" },
  { title: "Smart substitutions", copy: "Resolve absences with a fair, class-aware fill order before the bell rings.", icon: "shuffle" },
  { title: "Teacher requests", copy: "Log leave requests, extra-period approvals and admin actions in a single flow.", icon: "inbox" },
  { title: "Student visibility", copy: "Students see the class routine, today and next, and live changes without confusion.", icon: "graduate" },
  { title: "Print & share", copy: "Share a clean schedule or export the day in a format ready for front office use.", icon: "printer" },
  { title: "Offline ready", copy: "The latest school plan stays available even when the internet is briefly unstable.", icon: "offline" },
];

const typedHeadlinePhrases = [
  "Smart Timetables",
  "Fair Substitutions",
  "Live Coverage",
];

function TypewriterHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhraseIndex((previous) => (previous + 1) % typedHeadlinePhrases.length);
    }, 2800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="inline-grid min-h-[1.5em] min-w-[14ch] items-center overflow-hidden align-middle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={typedHeadlinePhrases[phraseIndex]}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="col-start-1 row-start-1"
        >
          {typedHeadlinePhrases[phraseIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AppRole>("admin");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role !== "student" || schoolQuery.trim().length < 2) {
      setSchools([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchSchools(schoolQuery.trim()).then(setSchools).catch(() => setSchools([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [role, schoolQuery]);

  const demoCredentials = {
    admin: {
      identifier: import.meta.env.VITE_DEMO_ADMIN_EMAIL,
      password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD,
    },
    teacher: {
      identifier: import.meta.env.VITE_DEMO_TEACHER_EMAIL,
      password: import.meta.env.VITE_DEMO_TEACHER_PASSWORD,
    },
    student: {
      identifier: import.meta.env.VITE_DEMO_STUDENT_ID,
      password: import.meta.env.VITE_DEMO_STUDENT_PASSWORD,
    },
  }[role];
  const demoSchoolId = import.meta.env.VITE_DEMO_SCHOOL_ID;
  const roleLabel = role === "student" ? "Admission number" : "Email address";

  const handleRoleChange = (nextRole: AppRole) => {
    setRole(nextRole);
    setError(null);
    setIdentifier("");
    setPassword("");
    setSchoolId("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await loginWithDatabase({ identifier: identifier.trim(), password, role, ...(role === "student" ? { schoolId } : {}) });
      if (appRoleFromUser(user) !== role) throw new Error("This account does not match the selected role.");
      const destination = role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/student";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!demoCredentials.identifier || !demoCredentials.password || (role === "student" && !demoSchoolId)) {
      setError("Demo login is not configured. Check the VITE_DEMO_* values in .env and restart Vite.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await loginWithDatabase({
        identifier: demoCredentials.identifier,
        password: demoCredentials.password,
        role,
        ...(role === "student" ? { schoolId: demoSchoolId } : {}),
      });
      if (appRoleFromUser(user) !== role) throw new Error("The demo account does not match the selected role.");
      const destination = role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/student";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in with the demo account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="classsync-dark-page grid min-h-screen place-items-center bg-[radial-gradient(60%_50%_at_20%_10%,rgba(99,102,241,0.16),transparent),radial-gradient(50%_50%_at_90%_90%,rgba(14,165,233,0.12),transparent),#080b17] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111729] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#442DC5] text-white shadow-lg shadow-indigo-950/20"><GraduationCap className="h-5 w-5" /></span>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">ClassSync</div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-300/20 bg-indigo-400/10 p-2.5 text-indigo-200"><LockKeyhole className="h-4 w-4" /></div>
        </div>

        <div role="tablist" aria-label="Sign in as" className="mb-5 grid grid-cols-3 gap-2 rounded-lg border border-slate-700 bg-[#0b1020] p-1">
          {(["admin", "teacher", "student"] as AppRole[]).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={role === tab} onClick={() => handleRoleChange(tab)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition duration-200 ${role === tab ? "bg-[#29264f] text-white shadow-sm ring-1 ring-indigo-300/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              {tab === "admin" ? "Administrator" : tab === "teacher" ? "Teacher" : "Student"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {role === "student" ? <label className="block text-sm font-medium text-slate-700">School
            <input required autoComplete="organization" value={schoolQuery} onChange={(event) => { setSchoolQuery(event.target.value); setSchoolId(""); }} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" placeholder="Search school, city, or state" />
            {schools.length > 0 ? <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">{schools.map((school) => <button type="button" key={school._id} onClick={() => { setSchoolId(school._id); setSchoolQuery(`${school.name} · ${school.city}`); setSchools([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">{school.name}<span className="ml-2 text-xs text-slate-500">{school.city}, {school.state}</span></button>)}</div> : null}
          </label> : null}
          <label className="block text-sm font-medium text-slate-200">
            {roleLabel}
            <input autoComplete={role === "student" ? "username" : "email"} required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-[#0b1020] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20" placeholder={role === "student" ? "e.g. A1042" : "name@school.edu"} />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <span className="relative mt-1 block">
              <input autoComplete="current-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-[#0b1020] px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20" placeholder="Enter your password" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button type="submit" disabled={isSubmitting || (role === "student" && !schoolId)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#442DC5] px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#3521a7] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-75">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : `Sign in`}
          </button>

          {demoCredentials.identifier && demoCredentials.password ? <button type="button" disabled={isSubmitting} onClick={() => void handleDemoLogin()} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Opening demo..." : "Continue with demo account"}</button> : null}
          <p className="text-center text-xs text-slate-400">Ask your school admin to reset your password.</p>
          <p className="text-center text-sm text-slate-300">Setting up a school? <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200 hover:underline">Register it here</Link></p>
          <Link to="/" className="block text-center text-sm font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline">Back to home</Link>
        </form>
      </div>
    </div>
  );
}

function RegisterSchoolPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<"school" | "teacher" | "student">("school");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [classes, setClasses] = useState<PublicClassSection[]>([]);
  const [classSectionId, setClassSectionId] = useState("");
  const [category, setCategory] = useState<"TGT" | "PGT" | "PRT">("TGT");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schoolQuery.trim().length < 2) { setSchools([]); return; }
    const timeout = window.setTimeout(() => void searchSchools(schoolQuery.trim()).then(setSchools).catch(() => setSchools([])), 250);
    return () => window.clearTimeout(timeout);
  }, [schoolQuery]);

  useEffect(() => {
    if (!schoolId || kind !== "student") { setClasses([]); return; }
    void getPublicClasses(schoolId).then(setClasses).catch(() => setClasses([]));
  }, [schoolId, kind]);

  const selectKind = (value: "school" | "teacher" | "student") => {
    setKind(value);
    setStep("details");
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      if (step === "otp") {
        const result = await verifyOtp(email.trim(), otp);
        setSchoolCode(result.schoolCode ?? "");
        navigate("/admin/setup", { replace: true, state: { schoolCode: result.schoolCode } });
        return;
      }
      if (kind === "school") {
        await registerForRole("school", { name: schoolName.trim(), board, state: stateName.trim(), city: city.trim(), schoolEmail: schoolEmail.trim(), phone: phone.trim(), adminName: name.trim(), adminEmail: email.trim(), password, academicYear: academicYear.trim(), classRange: [6, 12], website: "" });
        setStep("otp");
        setNotice("Enter the 6-digit code sent to your administrator email. In development, check the API console.");
      } else if (kind === "teacher") {
        await registerForRole("teacher", { schoolId, name: name.trim(), email: email.trim(), password, category, subjects: [] });
        setStep("otp");
        setNotice("Enter the 6-digit code sent to your email. In development, check the API console.");
      } else {
        await registerForRole("student", { schoolId, classSectionId, name: name.trim(), admissionNumber: admissionNumber.trim(), password });
        setNotice("Registration received. Waiting for approval from your school.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-100";
  return (
    <div className="classsync-dark-page grid min-h-screen place-items-center bg-[#080b17] p-5">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#111729] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase text-indigo-300">ClassSync registration</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Create an account</h1>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-2" role="tablist" aria-label="Registration type">
          {([ ["school", "Register my school"], ["teacher", "I am a teacher"], ["student", "I am a student"] ] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => selectKind(value)} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${kind === value ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-200" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{label}</button>)}
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
          {step === "otp" ? <>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">6-digit verification code<input required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} className={fieldClass} /></label>
            <p className="text-xs text-slate-500 sm:col-span-2">The code expires after 10 minutes.</p>
          </> : <>
            {kind !== "school" ? <div className="relative sm:col-span-2"><label className="text-sm font-medium text-slate-700">School<input required value={schoolQuery} onChange={(event) => { setSchoolQuery(event.target.value); setSchoolId(""); }} className={fieldClass} placeholder="Search by school, city, or state" /></label>{schools.length ? <div className="absolute z-10 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">{schools.map((school) => <button type="button" key={school._id} onClick={() => { setSchoolId(school._id); setSchoolQuery(`${school.name} · ${school.city}`); setSchools([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">{school.name}<span className="ml-2 text-xs text-slate-500">{school.city}, {school.state}</span></button>)}</div> : null}<p className="mt-1 text-xs text-slate-500">School not listed? Ask your school to register first.</p></div> : null}
            {kind !== "school" ? <label className="text-sm font-medium text-slate-700">Your name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label> : <>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">School name<input required minLength={2} value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700">Board<select value={board} onChange={(event) => setBoard(event.target.value)} className={fieldClass}><option>CBSE</option><option>ICSE</option><option>State</option><option>Other</option></select></label>
              <label className="text-sm font-medium text-slate-700">Academic year<input required value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700">State<input required value={stateName} onChange={(event) => setStateName(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700">City or district<input required value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700">School email<input required type="email" value={schoolEmail} onChange={(event) => setSchoolEmail(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700">School phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Principal or admin name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
            </>}
            {kind === "student" ? <>
              <label className="text-sm font-medium text-slate-700">Class and section<select required value={classSectionId} onChange={(event) => setClassSectionId(event.target.value)} className={fieldClass}><option value="">Choose class</option>{classes.map((entry) => <option key={entry._id} value={entry._id}>{entry.grade}-{entry.section}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Admission number<input required value={admissionNumber} onChange={(event) => setAdmissionNumber(event.target.value.toUpperCase())} className={fieldClass} /></label>
            </> : null}
            {kind === "teacher" ? <label className="text-sm font-medium text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value as "TGT" | "PGT" | "PRT")} className={fieldClass}><option>TGT</option><option>PGT</option><option>PRT</option></select></label> : null}
            {kind !== "student" ? <label className="text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></label> : null}
            {kind === "student" ? <input type="hidden" value="" /> : null}
            <label className="text-sm font-medium text-slate-700">Password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} /></label>
            {kind === "student" ? <input type="email" aria-label="Email honeypot" tabIndex={-1} autoComplete="off" className="hidden" /> : null}
          </>}
          {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
          {notice ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">{notice}{schoolCode ? ` School code: ${schoolCode}` : ""}</p> : null}
          <button type="submit" disabled={isSubmitting || (kind !== "school" && step === "details" && !schoolId)} className="flex items-center justify-center gap-2 rounded-lg bg-[#442DC5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3925b4] disabled:opacity-70 sm:col-span-2">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : step === "otp" ? "Verify code" : kind === "school" || kind === "teacher" ? "Continue to email verification" : "Create student account"}</button>
          <p className="text-center text-sm text-slate-600 sm:col-span-2">Already registered? <Link to="/login" className="font-semibold text-[#442DC5] hover:underline">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}

function RoleDashboard({ role, title, subtitle, status = "Live and synced", children }: { role: AppRole; title: string; subtitle: string; status?: string; children: React.ReactNode }) {
  const navItems = {
    admin: [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Timetable", to: "/admin/timetable" },
      { label: "Substitutions", to: "/admin/substitutions" },
      { label: "Requests", to: "/admin/requests" },
      { label: "User accounts", to: "/admin/accounts" },
    ],
    teacher: [
      { label: "Dashboard", to: "/teacher/dashboard" },
      { label: "Routine", to: "/teacher/routine" },
      { label: "Requests", to: "/teacher/requests" },
    ],
    student: [
      { label: "Today", to: "/student" },
      { label: "Weekly view", to: "/student/weekly" },
      { label: "Complaints", to: "/student/complaints" },
    ],
  }[role];

  const location = useLocation();
  return (
    <div className="classsync-dark-page min-h-screen bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12),_transparent_40%),#080b17]">
      <div className="mx-auto grid max-w-[1440px] gap-5 p-3 sm:p-5 lg:grid-cols-[236px_1fr] lg:gap-7 lg:p-7">
        <aside className="no-print min-w-0 h-fit rounded-2xl border border-white/10 bg-[#030416] p-3 text-white shadow-[0_20px_50px_rgba(3,4,22,0.22)] lg:sticky lg:top-7">
          <Link to="/" className="mb-4 flex items-center gap-3 rounded-xl px-2.5 py-3 transition-colors hover:bg-white/5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#7664ff] to-[#442DC5] text-white shadow-lg shadow-indigo-950/30"><GraduationCap className="h-5 w-5" /></span>
            <span><span className="block text-sm font-bold leading-tight tracking-wide text-white">ClassSync</span><span className="mt-1 block text-xs font-medium capitalize text-slate-300">{role} portal</span></span>
          </Link>
          <div className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
          <nav aria-label={`${role} navigation`} className="flex min-w-0 gap-1.5 overflow-x-auto lg:flex-col">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-semibold transition duration-200 ${active ? "border-indigo-300/20 bg-indigo-500/20 text-white shadow-inner shadow-indigo-300/10" : "border-transparent text-slate-300 hover:bg-white/10 hover:text-white"}`}>{item.label}</Link>;
            })}
          </nav>
          <div className="mt-5 hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 lg:block">
            <p className="text-xs font-semibold text-slate-200">A calmer school day</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Your school workspace, at a glance.</p>
          </div>
        </aside>

        <main className="min-w-0 rounded-2xl">
          <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#111729] px-5 py-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)] sm:px-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">{role} workspace</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-1 text-sm leading-5 text-slate-300">{subtitle}</p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status === "Coming soon" ? "border-slate-600 bg-slate-800 text-slate-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>
              {status !== "Coming soon" ? <CheckCircle2 className="h-4 w-4" /> : null}{status}
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  return (
    <RoleDashboard role="admin" title="Command dashboard" subtitle="Today's faculty, absences and substitution coverage at a glance.">
      <ComingSoonCard description="The redesigned dashboard is on its way." />
    </RoleDashboard>
  );
}

function AdminSubstitutionsPage() {
  return (
    <RoleDashboard role="admin" title="Substitution centre" subtitle="Review coverage actions and school-day resilience." status="Coming soon">
      <ComingSoonCard description="Substitution planning and assignments are not connected in this demo. No coverage changes will be made from this page." />
    </RoleDashboard>
  );
}

function AdminRequestsPage() {
  return (
    <RoleDashboard role="admin" title="Request inbox" subtitle="Approve participation changes before they affect the timetable." status="Coming soon">
      <ComingSoonCard description="Request submission and approval are not connected in this demo. The timetable will not be changed from this page." />
    </RoleDashboard>
  );
}

function AdminAccountsPage() {
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await registerSchoolAccount({
        role,
        email: email.trim(),
        password,
        admissionNumber: role === "STUDENT" ? admissionNumber.trim() : undefined,
        profile: { name: name.trim() },
      });
      setMessage(`${role === "TEACHER" ? "Teacher" : "Student"} account created. They can now sign in with their credentials.`);
      setName("");
      setEmail("");
      setAdmissionNumber("");
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create this account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleDashboard role="admin" title="User accounts" subtitle="Create sign-in accounts for staff and students in this school.">
      <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <label className="text-sm font-medium text-slate-700">Account type
            <select value={role} onChange={(event) => setRole(event.target.value as "TEACHER" | "STUDENT")} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-200">
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Full name
            <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-200" placeholder="Full name" />
          </label>
          <label className="text-sm font-medium text-slate-700">Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-200" placeholder="name@school.edu" />
          </label>
          {role === "STUDENT" ? <label className="text-sm font-medium text-slate-700">Admission number
            <input required value={admissionNumber} onChange={(event) => setAdmissionNumber(event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 uppercase outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-200" placeholder="e.g. A1042" />
          </label> : null}
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Temporary password
            <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#442DC5] focus:ring-4 focus:ring-indigo-200" placeholder="At least 8 characters" />
          </label>
          {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
          {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">{message}</p> : null}
          <button disabled={saving} className="rounded-xl bg-[#442DC5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3925b4] disabled:opacity-70 sm:col-span-2">
            {saving ? "Creating account..." : `Create ${role === "TEACHER" ? "teacher" : "student"} account`}
          </button>
        </form>
      </section>
    </RoleDashboard>
  );
}

function TeacherDashboardPage() {
  return (
    <RoleDashboard role="teacher" title="Teacher workflow" subtitle="Review the day, your classroom plan and any approval requests." status="Coming soon">
      <ComingSoonCard description="Personalized teacher schedules and daily assignments are not connected in this demo." />
    </RoleDashboard>
  );
}

function TeacherRoutinePage() {
  return (
    <RoleDashboard role="teacher" title="Routine" subtitle="Your daily structure and classroom plan for the school day." status="Coming soon">
      <ComingSoonCard description="Your published class-by-class routine will appear here when the teacher timetable view is connected." />
    </RoleDashboard>
  );
}

function StudentDashboardPage() {
  return (
    <RoleDashboard role="student" title="Today's timetable" subtitle="Today's plan, live updates and the next major class transition." status="Coming soon">
      <ComingSoonCard description="Today's classes and live timetable changes are not connected in this demo." />
    </RoleDashboard>
  );
}

function StudentWeeklyPage() {
  return (
    <RoleDashboard role="student" title="Weekly timetable" subtitle="Check the week ahead and any substitutions that affect your classes." status="Coming soon">
      <ComingSoonCard description="Your published weekly class timetable is not connected in this demo." />
    </RoleDashboard>
  );
}

function TeacherRequestsPage() {
  return (
    <RoleDashboard role="teacher" title="Teacher requests" subtitle="Submit a request for administrator review." status="Coming soon">
      <ComingSoonCard description="Teacher request submission and approval tracking are not connected in this demo." />
    </RoleDashboard>
  );
}

function StudentComplaintsPage() {
  return (
    <RoleDashboard role="student" title="Student complaints" subtitle="Share a concern with the appropriate school administrator." status="Coming soon">
      <ComingSoonCard description="Complaint submission is not connected in this demo. No student identity or complaint data is submitted from this page." />
    </RoleDashboard>
  );
}

function ComingSoonCard({ description }: { description: string }) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-[#111729] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-8">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
          <CalendarClock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Coming soon</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </section>
  );
}

function ForbiddenPage() {
  return (
    <div className="classsync-dark-page grid min-h-screen place-items-center bg-[#080b17] p-6">
      <div className="max-w-md rounded-[28px] border border-slate-700 bg-[#111729] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-rose-400/20 bg-rose-400/10 text-2xl font-bold text-rose-300">403</div>
        <h1 className="text-2xl font-bold text-white">Access denied</h1>
        <p className="mt-2 text-sm text-slate-300">This route is restricted for your role. Please sign in with the correct account.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-xl bg-[#442DC5] px-4 py-2 text-sm font-semibold text-white">Go to login</Link>
          <Link to="/" className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">Back home</Link>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { role: AppRole; children: React.ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out">("loading");
  const [actualRole, setActualRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      setActualRole(user ? appRoleFromUser(user) : null);
      setStatus(user ? "ready" : "signed-out");
    }).catch(() => {
      if (!active) return;
      setActualRole(null);
      setStatus("signed-out");
    });
    return () => { active = false; };
  }, []);

  if (status === "loading") return <div className="classsync-dark-page grid min-h-screen place-items-center bg-[#080b17] text-sm text-slate-300">Checking your session...</div>;
  if (status === "signed-out" || !actualRole) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isPathAllowedForRole(location.pathname, actualRole)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterSchoolPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />

        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute role="admin"><RoleDashboard role="admin" title="Master timetable" subtitle="Review the published weekly class routine." status="Coming soon"><ComingSoonCard description="The timetable shown in the previous preview was sample data. Live timetable editing and publishing are not connected in this demo." /></RoleDashboard></ProtectedRoute>} />
        <Route path="/admin/substitutions" element={<ProtectedRoute role="admin"><AdminSubstitutionsPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute role="admin"><AdminRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute role="admin"><AdminAccountsPage /></ProtectedRoute>} />

        <Route path="/teacher/dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboardPage /></ProtectedRoute>} />
        <Route path="/teacher/routine" element={<ProtectedRoute role="teacher"><TeacherRoutinePage /></ProtectedRoute>} />
        <Route path="/teacher/requests" element={<ProtectedRoute role="teacher"><TeacherRequestsPage /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/student/weekly" element={<ProtectedRoute role="student"><StudentWeeklyPage /></ProtectedRoute>} />
        <Route path="/student/complaints" element={<ProtectedRoute role="student"><StudentComplaintsPage /></ProtectedRoute>} />

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
