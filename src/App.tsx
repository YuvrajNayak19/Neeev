import { CalendarClock, CheckCircle2, GraduationCap } from "lucide-react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { isPathAllowedForRole, type AppRole } from "./lib/access";
import { appRoleFromUser } from "./lib/auth-api";
import { useMe } from "./lib/session";
import { LoginPage } from "./pages/auth/login-page";
import { RegisterPage } from "./pages/auth/register-page";

import { LandingPage } from "./pages/landing-page";
import { LegalPage } from "./pages/legal-page";
import { SchedulePage } from "./pages/schedule-page";


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
  const me = useMe();
  if (me.isLoading) return <div className="grid min-h-screen place-items-center bg-cream text-sm text-ink-muted">Checking your session…</div>;
  const role = me.data ? appRoleFromUser(me.data.user) : null;
  if (!role) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isPathAllowedForRole(location.pathname, role)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />

        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute role="admin"><RoleDashboard role="admin" title="Master timetable" subtitle="Review the published weekly class routine." status="Coming soon"><ComingSoonCard description="The timetable shown in the previous preview was sample data. Live timetable editing and publishing are not connected in this demo." /></RoleDashboard></ProtectedRoute>} />
        <Route path="/admin/substitutions" element={<ProtectedRoute role="admin"><AdminSubstitutionsPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute role="admin"><AdminRequestsPage /></ProtectedRoute>} />
        
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
