import { Lock } from "lucide-react";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isPathAllowedForRole } from "@/lib/access";
import { appRoleFromUser, homePathFor } from "@/lib/auth-api";
import { useMe } from "@/lib/session";
import { LandingPage } from "@/pages/landing-page";

// Everything behind sign-in is split out so the public landing page stays light.
const named = <T extends Record<string, unknown>>(loader: () => Promise<T>, key: keyof T) => lazy(() => loader().then((module) => ({ default: module[key] as React.ComponentType })));
const AppShell = lazy(() => import("@/components/app/app-shell").then((module) => ({ default: module.AppShell })));
const LoginPage = named(() => import("@/pages/auth/login-page"), "LoginPage");
const RegisterPage = named(() => import("@/pages/auth/register-page"), "RegisterPage");
const SchedulePage = named(() => import("@/pages/schedule-page"), "SchedulePage");
const LegalPage = lazy(() => import("@/pages/legal-page").then((module) => ({ default: module.LegalPage })));
const AdminDashboardPage = named(() => import("@/pages/admin/dashboard-page"), "AdminDashboardPage");
const TimetablePage = named(() => import("@/pages/admin/timetable-page"), "TimetablePage");
const SubstitutionsPage = named(() => import("@/pages/admin/substitutions-page"), "SubstitutionsPage");
const RequestsPage = named(() => import("@/pages/admin/requests-page"), "RequestsPage");
const PeoplePage = named(() => import("@/pages/admin/people-page"), "PeoplePage");
const AdminConcernsPage = named(() => import("@/pages/concerns-pages"), "AdminConcernsPage");
const StudentConcernsPage = named(() => import("@/pages/concerns-pages"), "StudentConcernsPage");
const TeacherDashboardPage = named(() => import("@/pages/teacher-pages"), "TeacherDashboardPage");
const TeacherRoutinePage = named(() => import("@/pages/teacher-pages"), "TeacherRoutinePage");
const TeacherRequestsPage = named(() => import("@/pages/teacher-pages"), "TeacherRequestsPage");
const StudentTodayPage = named(() => import("@/pages/student-pages"), "StudentTodayPage");
const StudentWeeklyPage = named(() => import("@/pages/student-pages"), "StudentWeeklyPage");
const AccountPage = named(() => import("@/pages/account-page"), "AccountPage");

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-32" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
}

function FullScreenFallback() {
  return <div className="grid min-h-screen place-items-center bg-cream"><Logo className="animate-pulse" /></div>;
}

/** Signed-in area: checks the session and role, then renders the page inside the app shell. */
function ProtectedLayout() {
  const location = useLocation();
  const me = useMe();
  if (me.isLoading) return <FullScreenFallback />;
  const role = me.data ? appRoleFromUser(me.data.user) : null;
  if (!role) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isPathAllowedForRole(location.pathname, role)) return <Navigate to="/403" replace />;
  return (
    <Suspense fallback={<FullScreenFallback />}>
      <AppShell>
        <Suspense fallback={<PageFallback />}><Outlet /></Suspense>
      </AppShell>
    </Suspense>
  );
}

/** Signed-in people who open /login or /register go straight to their workspace. */
function GuestOnly({ children }: { children: ReactNode }) {
  const me = useMe();
  if (me.isLoading) return <FullScreenFallback />;
  if (me.data) return <Navigate to={homePathFor(appRoleFromUser(me.data.user))} replace />;
  return <>{children}</>;
}

function ForbiddenPage() {
  const me = useMe();
  const home = homePathFor(me.data ? appRoleFromUser(me.data.user) : null);
  return (
    <main className="grid min-h-screen place-items-center bg-cream p-6">
      <div className="max-w-md rounded-3xl border border-line bg-paper p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-peach-100 text-plum"><Lock className="h-6 w-6" /></span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">This page isn't for your account</h1>
        <p className="mt-2 text-ink-muted">You're signed in, but this part of ClassSync belongs to a different role. Head back to your own workspace.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild><Link to={home}>Go to my workspace</Link></Button>
          <Button asChild variant="outline"><Link to="/">Home</Link></Button>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/403" element={<ForbiddenPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/timetable" element={<TimetablePage />} />
            <Route path="/admin/substitutions" element={<SubstitutionsPage />} />
            <Route path="/admin/requests" element={<RequestsPage />} />
            <Route path="/admin/accounts" element={<PeoplePage />} />
            <Route path="/admin/concerns" element={<AdminConcernsPage />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/teacher/routine" element={<TeacherRoutinePage />} />
            <Route path="/teacher/requests" element={<TeacherRequestsPage />} />
            <Route path="/student" element={<StudentTodayPage />} />
            <Route path="/student/weekly" element={<StudentWeeklyPage />} />
            <Route path="/student/concerns" element={<StudentConcernsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route path="/student/complaints" element={<Navigate to="/student/concerns" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
