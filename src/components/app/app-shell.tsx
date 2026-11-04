import {
  Bell,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  Repeat2,
  Settings,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications, useReadNotifications } from "@/lib/api";
import type { AppRole } from "@/lib/access";
import { appRoleFromUser } from "@/lib/auth-api";
import { currentSchoolDate, formatLongDate } from "@/lib/school-time";
import { displayName, useLogout, useMe } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

type NavItem = { label: string; to: string; icon: LucideIcon };

const NAV: Record<AppRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Timetable", to: "/admin/timetable", icon: Table2 },
    { label: "Substitutions", to: "/admin/substitutions", icon: Repeat2 },
    { label: "Requests", to: "/admin/requests", icon: ClipboardList },
    { label: "People", to: "/admin/accounts", icon: Users },
    { label: "Student concerns", to: "/admin/concerns", icon: MessageSquareHeart },
  ],
  teacher: [
    { label: "My day", to: "/teacher/dashboard", icon: Home },
    { label: "Weekly routine", to: "/teacher/routine", icon: CalendarDays },
    { label: "Requests", to: "/teacher/requests", icon: ClipboardList },
  ],
  student: [
    { label: "Today", to: "/student", icon: Home },
    { label: "Weekly timetable", to: "/student/weekly", icon: CalendarDays },
    { label: "Raise a concern", to: "/student/concerns", icon: MessageSquareHeart },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = { admin: "School office", teacher: "Teacher", student: "Student" };

function SideNav({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-1">
      {NAV[role].map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
              isActive ? "bg-paper text-ink shadow-soft" : "text-ink-muted hover:bg-paper/60 hover:text-ink",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors", isActive ? "bg-plum text-cream" : "bg-sand/80 text-ink-muted group-hover:text-plum")}>
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SchoolCard() {
  const me = useMe();
  if (!me.data?.school) return null;
  return (
    <div className="rounded-2xl border border-line bg-paper/70 p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-peach-200 text-plum"><GraduationCap className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{me.data.school.name}</p>
          <p className="truncate text-xs text-ink-muted">{me.data.school.city}{me.data.school.academicYear ? ` · ${me.data.school.academicYear}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

function NotificationsMenu() {
  const notifications = useNotifications();
  const markRead = useReadNotifications();
  const navigate = useNavigate();
  const unread = notifications.data?.unread ?? 0;
  const items = notifications.data?.notifications ?? [];
  return (
    <DropdownMenu onOpenChange={(open) => { if (!open && unread) markRead.mutate(undefined); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
          <Bell className="!size-5" />
          {unread ? <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-ink">{unread}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {items.length === 0 ? <p className="px-3 py-6 text-center text-sm text-ink-muted">You're all caught up.</p> : null}
          {items.map((item) => (
            <DropdownMenuItem key={item.id} onSelect={() => item.link && navigate(item.link)} className="items-start gap-3 py-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.read ? "bg-line-strong" : "bg-coral")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{item.title}</span>
                <span className="block text-xs font-normal leading-relaxed text-ink-muted">{item.message}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu({ role }: { role: AppRole }) {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const name = displayName(me.data);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className="flex items-center gap-2.5 rounded-full p-1 pr-1 transition-colors hover:bg-sand sm:pr-3">
          <Avatar name={name} size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block max-w-[10rem] truncate text-sm font-semibold leading-tight text-ink">{name}</span>
            <span className="block text-xs leading-tight text-ink-muted">{ROLE_LABEL[role]}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
        <p className="truncate px-2.5 pb-2 text-sm font-semibold text-ink">{me.data?.user.email ?? me.data?.user.admissionNumber ?? name}</p>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/account")}><Settings className="h-4 w-4" />Profile &amp; settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/")}><Home className="h-4 w-4" />ClassSync home</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout().then(() => navigate("/login", { replace: true }))} className="text-brick focus:text-brick">
          <LogOut className="h-4 w-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Warm, light workspace frame: sidebar on desktop, slide-in menu on phones, top bar with date, bell and account. */
export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const location = useLocation();
  const role = me.data ? appRoleFromUser(me.data.user) ?? "student" : "student";
  const today = formatLongDate(currentSchoolDate());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-plum focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream">Skip to content</a>
      <aside className="no-print sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-peach-50/70 px-4 py-5 lg:flex">
        <Link to={NAV[role][0].to} className="rounded-lg px-2" aria-label="ClassSync workspace home"><Logo /></Link>
        <SideNav role={role} />
        <div className="mt-auto"><SchoolCard /></div>
      </aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="!size-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="gap-6 bg-peach-50 px-4 py-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Move between ClassSync pages</SheetDescription>
                <div className="px-2"><Logo /></div>
                <SideNav role={role} onNavigate={() => setMenuOpen(false)} />
                <div className="mt-auto"><SchoolCard /></div>
              </SheetContent>
            </Sheet>
            <Link to={NAV[role][0].to} className="lg:hidden" aria-label="ClassSync workspace home"><Logo className="[&>span:nth-child(2)]:hidden xs:[&>span:nth-child(2)]:inline" /></Link>
            <p className="hidden text-sm font-medium text-ink-muted md:block"><CalendarDays className="mr-1.5 inline h-4 w-4 -translate-y-px text-plum" />{today}</p>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NotificationsMenu />
              <AccountMenu role={role} />
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1.5 font-display text-[1.85rem] font-semibold leading-tight text-ink sm:text-[2.15rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
