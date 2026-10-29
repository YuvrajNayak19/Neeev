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

import { LandingPage } from "./components/public/landing-page";
import { AdminDashboardContent } from "./components/admin/admin-dashboard";
import { SchedulePortalPage } from "./components/public/schedule-portal";

const DesignSystemPage = lazy(() => import("./routes/design").then((module) => ({ default: module.DesignSystemPage })));
const AdminTimetableScreen = lazy(() => import("./components/timetable/admin-timetable-page").then((module) => ({ default: module.AdminTimetablePage })));

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

const adminCoverage = [
  { teacher: "Mr. Aarav Mehta", dept: "Science", periods: "P3, P5", cover: "Ms. Diya Kapoor", status: "Covered" },
  { teacher: "Ms. Riya Sen", dept: "English", periods: "P6", cover: "Ms. Meera Nair", status: "Pending" },
  { teacher: "Mr. Rohan Iyer", dept: "Maths", periods: "P2", cover: "Mr. Vikram Singh", status: "Covered" },
];

const classSchedule = [
  { period: "P1", time: "08:20-09:00", subject: "English", teacher: "Asha Verma", room: "Room 6A" },
  { period: "P2", time: "09:00-09:40", subject: "Maths", teacher: "Ravi Kumar", room: "Room 6A" },
  { period: "P3", time: "09:40-10:20", subject: "Science", teacher: "Nisha Shah", room: "Physics Lab" },
  { period: "P4", time: "10:20-11:00", subject: "Social", teacher: "Rohan Das", room: "Room 7B" },
  { period: "P5", time: "11:20-12:00", subject: "Science", teacher: "Cover: Ms. Kapoor", room: "Physics Lab", highlight: true },
  { period: "P6", time: "12:00-12:40", subject: "Computer", teacher: "Mohan Roy", room: "IT Lab" },
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

  const demo = {
    admin: import.meta.env.VITE_DEMO_ADMIN_EMAIL as string | undefined,
    teacher: import.meta.env.VITE_DEMO_TEACHER_EMAIL as string | undefined,
    student: import.meta.env.VITE_DEMO_STUDENT_ID as string | undefined,
  }[role];
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
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

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(60%_50%_at_20%_10%,rgba(99,102,241,0.14),transparent),radial-gradient(50%_50%_at_90%_90%,rgba(14,165,233,0.10),transparent)] bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">EduSync</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          </div>
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><LockKeyhole className="h-4 w-4" /></div>
        </div>

        <div role="tablist" aria-label="Sign in as" className="mb-5 grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
          {(["admin", "teacher", "student"] as AppRole[]).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={role === tab} onClick={() => handleRoleChange(tab)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${role === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {tab === "admin" ? "Administrator" : tab === "teacher" ? "Teacher" : "Student"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {role === "student" ? <label className="block text-sm font-medium text-slate-700">School
            <input required autoComplete="organization" value={schoolQuery} onChange={(event) => { setSchoolQuery(event.target.value); setSchoolId(""); }} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" placeholder="Search school, city, or state" />
            {schools.length > 0 ? <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">{schools.map((school) => <button type="button" key={school._id} onClick={() => { setSchoolId(school._id); setSchoolQuery(`${school.name} · ${school.city}`); setSchools([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">{school.name}<span className="ml-2 text-xs text-slate-500">{school.city}, {school.state}</span></button>)}</div> : null}
          </label> : null}
          <label className="block text-sm font-medium text-slate-700">
            {roleLabel}
            <input autoComplete={role === "student" ? "username" : "email"} required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" placeholder={role === "student" ? "e.g. A1042" : "name@school.edu"} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="relative mt-1 block">
              <input autoComplete="current-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" placeholder="Enter your password" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-900">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button type="submit" disabled={isSubmitting || (role === "student" && !schoolId)} className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-75">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : `Sign in`}
          </button>

          {demo && demoPassword ? <button type="button" onClick={() => { setIdentifier(demo); setPassword(demoPassword); }} className="w-full rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Demo Quick Fill</button> : null}
          <p className="text-center text-xs text-slate-500">Ask your school admin to reset your password.</p>
          <p className="text-center text-sm text-slate-600">Setting up a school? <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Register it here</Link></p>
          <Link to="/" className="block text-center text-sm font-medium text-slate-600 underline-offset-4 hover:underline">Back to home</Link>
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
    <div className="grid min-h-screen place-items-center bg-[#F2F6F9] p-5">
      <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase text-[#442DC5]">EduSync registration</p>
          <h1 className="mt-2 text-2xl font-bold text-[#121824]">Create an account</h1>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-2" role="tablist" aria-label="Registration type">
          {([ ["school", "Register my school"], ["teacher", "I am a teacher"], ["student", "I am a student"] ] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => selectKind(value)} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${kind === value ? "border-[#442DC5] bg-indigo-50 text-[#442DC5]" : "border-slate-200 text-slate-600"}`}>{label}</button>)}
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

function RoleDashboard({ role, title, subtitle, children }: { role: AppRole; title: string; subtitle: string; children: React.ReactNode }) {
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[208px_1fr] lg:p-6">
        <aside className="no-print h-fit rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-6">
          <Link to="/" className="mb-3 flex items-center gap-2.5 px-2 py-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">E</span>
            <span><span className="block text-sm font-semibold leading-tight text-slate-900">EduSync</span><span className="block text-[11px] capitalize text-slate-500">{role} portal</span></span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return <Link key={item.to} to={item.to} className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{item.label}</Link>;
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Live and synced</span>
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
      <AdminDashboardContent />
    </RoleDashboard>
  );
}

function AdminSubstitutionsPage() {
  return (
    <RoleDashboard role="admin" title="Substitution centre" subtitle="Review coverage actions and school-day resilience.">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#121824]">Coverage response</h2>
          <button className="rounded-xl bg-[#442DC5] px-4 py-2 text-sm font-semibold text-white">Run substitution solver</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Teacher</th>
                <th className="px-3 py-2.5 font-semibold">Department</th>
                <th className="px-3 py-2.5 font-semibold">Periods</th>
                <th className="px-3 py-2.5 font-semibold">Assigned cover</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminCoverage.map((row) => (
                <tr key={row.teacher} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-medium text-slate-800">{row.teacher}</td>
                  <td className="px-3 py-3 text-slate-600">{row.dept}</td>
                  <td className="px-3 py-3 text-slate-600">{row.periods}</td>
                  <td className="px-3 py-3 text-slate-600">{row.cover}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.status === "Covered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RoleDashboard>
  );
}

function AdminRequestsPage() {
  return (
    <RoleDashboard role="admin" title="Request inbox" subtitle="Approve participation changes before they affect the timetable.">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="font-semibold text-[#121824]">Leave request</div>
              <div className="text-sm text-slate-600">Mr. Rohan Iyer requested leave for Friday morning.</div>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">Pending</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="font-semibold text-[#121824]">Extra period</div>
              <div className="text-sm text-slate-600">Chemistry extra period requested for Class 11-A.</div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Approved</span>
          </div>
        </div>
      </div>
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
    <RoleDashboard role="teacher" title="Teacher workflow" subtitle="Review the day, your classroom plan and any approval requests.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "P1 · English · 9-A", status: "Current" },
          { label: "P2 · Maths · 10-A", status: "Next" },
          { label: "P3 · Science · 8-B", status: "Assigned" },
          { label: "P4 · Chemistry · 11-A", status: "Covered" },
          { label: "P5 · Free period", status: "Available" },
        ].map((entry) => (
          <div key={entry.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#121824]">{entry.label}</div>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#442DC5]">{entry.status}</span>
            </div>
          </div>
        ))}
      </div>
    </RoleDashboard>
  );
}

function TeacherRoutinePage() {
  return (
    <RoleDashboard role="teacher" title="Routine" subtitle="Your daily structure and classroom plan for the school day.">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Period 1", value: "English · Class 9-A" },
            { label: "Period 2", value: "Maths · Class 10-A" },
            { label: "Period 3", value: "Science · Class 8-B" },
            { label: "Period 4", value: "English · Class 7-A" },
            { label: "Period 5", value: "Cover duty · Class 10-A" },
            { label: "Period 6", value: "Free period" },
          ].map((entry) => (
            <div key={entry.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{entry.label}</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{entry.value}</div>
            </div>
          ))}
        </div>
      </div>
    </RoleDashboard>
  );
}

function StudentDashboardPage() {
  return (
    <RoleDashboard role="student" title="Class 10-A" subtitle="Today’s plan, live updates and the next major class transition.">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-[#121824]">Now and next</div>
          <div className="mt-3 text-sm text-slate-600">Current period: Science · Ends in 12 minutes</div>
          <div className="mt-2 text-sm text-slate-600">Next: Computer · 12:00 PM</div>
        </div>
      </div>
    </RoleDashboard>
  );
}

function StudentWeeklyPage() {
  return (
    <RoleDashboard role="student" title="Weekly timetable" subtitle="Check the week ahead and any substitutions that affect your classes.">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classSchedule.map((slot) => (
            <div key={slot.period} className={`rounded-2xl border p-4 ${slot.highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{slot.period}</div>
              <div className="mt-2 text-lg font-bold text-[#121824]">{slot.subject}</div>
              <div className="mt-2 text-sm text-slate-600">{slot.teacher}</div>
              <div className="mt-1 text-xs text-slate-500">{slot.room}</div>
            </div>
          ))}
        </div>
      </div>
    </RoleDashboard>
  );
}

function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F2F6F9] p-6">
      <div className="max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-2xl text-rose-700">403</div>
        <h1 className="text-2xl font-bold text-[#121824]">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">This route is restricted for your role. Please sign in with the correct account.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-xl bg-[#442DC5] px-4 py-2 text-sm font-semibold text-white">Go to login</Link>
          <Link to="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Back home</Link>
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

  if (status === "loading") return <div className="grid min-h-screen place-items-center bg-[#F2F6F9] text-sm text-slate-500">Checking your session...</div>;
  if (status === "signed-out" || !actualRole) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isPathAllowedForRole(location.pathname, actualRole)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/design" element={<Suspense fallback={<main className="min-h-screen bg-[#f7f8fa]" />}><DesignSystemPage /></Suspense>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterSchoolPage />} />
        <Route path="/schedule" element={<SchedulePortalPage />} />

        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute role="admin"><Suspense fallback={<main className="min-h-screen bg-[#f5f6f8]" />}><AdminTimetableScreen /></Suspense></ProtectedRoute>} />
        <Route path="/admin/substitutions" element={<ProtectedRoute role="admin"><AdminSubstitutionsPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute role="admin"><AdminRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute role="admin"><AdminAccountsPage /></ProtectedRoute>} />

        <Route path="/teacher/dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboardPage /></ProtectedRoute>} />
        <Route path="/teacher/routine" element={<ProtectedRoute role="teacher"><TeacherRoutinePage /></ProtectedRoute>} />
        <Route path="/teacher/requests" element={<ProtectedRoute role="teacher"><AdminRequestsPage /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/student/weekly" element={<ProtectedRoute role="student"><StudentWeeklyPage /></ProtectedRoute>} />
        <Route path="/student/complaints" element={<ProtectedRoute role="student"><StudentDashboardPage /></ProtectedRoute>} />

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
