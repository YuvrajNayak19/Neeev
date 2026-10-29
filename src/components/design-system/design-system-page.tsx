import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Download,
  Moon,
  Filter,
  GraduationCap,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Users,
  WifiOff,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CommandMenu, CoverageRing, Dialog, Drawer, MetricCard, NowNextCard, TimetableCell, Toast } from "@/components/design-system/timetable-primitives";
import { toast } from "sonner";

export { DesignPage as DesignSystemPage };

const teachers = [
  { name: "Aarav Mehta", subject: "Science · Grade 8", initials: "AM", color: "bg-indigo-100 text-indigo-800" },
  { name: "Riya Sen", subject: "English · Grade 9", initials: "RS", color: "bg-emerald-100 text-emerald-800" },
  { name: "Vikram Singh", subject: "Mathematics · Grade 10", initials: "VS", color: "bg-amber-100 text-amber-800" },
];

const scheduleRows = [
  { time: "08:20 AM", period: "01", className: "8-A", subject: "Science", teacher: "Aarav Mehta", room: "Lab 02", status: "On time" },
  { time: "09:00 AM", period: "02", className: "8-A", subject: "Mathematics", teacher: "Nisha Rao", room: "Room 14", status: "On time" },
  { time: "09:40 AM", period: "03", className: "8-A", subject: "English", teacher: "Riya Sen", room: "Room 14", status: "Substitute" },
];

const swatches = [
  { name: "Indigo 700", value: "#442DC5", className: "bg-[#442DC5]" },
  { name: "Ink 900", value: "#171923", className: "bg-[#171923]" },
  { name: "Slate 600", value: "#596273", className: "bg-[#596273]" },
  { name: "Mist 100", value: "#F1F3F7", className: "bg-[#F1F3F7]" },
  { name: "Success", value: "#18845B", className: "bg-[#18845B]" },
  { name: "Warning", value: "#946000", className: "bg-[#946000]" },
];

function DesignPage() {
  useEffect(() => {
    document.title = "Design system | EduSync";
  }, []);

  const [activeSection, setActiveSection] = useState("overview");
  const [selectedTab, setSelectedTab] = useState("all");
  const [showNotice, setShowNotice] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const saveDraft = () => {
    setIsSaving(true);
    window.setTimeout(() => setIsSaving(false), 1100);
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Command },
    { id: "foundations", label: "Foundations", icon: SlidersHorizontal },
    { id: "components", label: "Components", icon: Settings2 },
    { id: "data-display", label: "Data display", icon: CalendarDays },
    { id: "states", label: "States & feedback", icon: Bell },
  ];

  return (
    <main
      className={`design-page min-h-screen bg-[#f7f8fa] text-[#171923] [--color-primary:#442dc5] [--color-primary-foreground:#ffffff] [--color-ring:#7966dc] [--color-border:#e5e7ed] [--color-input:#e5e7ed] [--color-background:#ffffff] [--color-foreground:#171923] [--color-muted:#f1f3f7] [--color-muted-foreground:#596273] [--color-accent:#f1efff] [--color-accent-foreground:#302184] [--color-secondary:#f1f3f7] [--color-secondary-foreground:#343847] [--radius:0.75rem]${isDark ? " design-dark dark" : ""}`}
    >
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-[#e6e8ee] bg-white px-4 py-5 lg:flex">
          <div className="mb-9 flex items-center gap-3 px-2">
            <div className="grid size-8 place-items-center rounded-[10px] bg-[#442dc5] text-white shadow-[0_4px_12px_rgba(68,45,197,0.2)]">
              <GraduationCap className="size-[18px]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold leading-4 tracking-[-0.2px]">EduSync</div>
              <div className="mt-1 truncate text-[11px] text-[#8991a1]">Design foundations</div>
            </div>
            <ChevronDown className="ml-auto size-4 text-[#8790a0]" />
          </div>

          <div className="px-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#9aa1af]">Workspace</div>
          <nav className="mt-2 space-y-1" aria-label="Design sections">
            {navItems.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setActiveSection(id)}
                className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7966dc] ${activeSection === id ? "bg-[#f0edff] text-[#442dc5]" : "text-[#60697a] hover:bg-[#f4f5f8] hover:text-[#222635]"}`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-[#e9eaf0] bg-[#fbfbfc] p-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#18845b]" />
              <span className="text-xs font-medium text-[#3d4554]">System status</span>
              <span className="ml-auto text-[10px] text-[#858d9b]">All systems normal</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#eceef2] pt-3">
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-[#e8e4ff] text-[10px] font-semibold text-[#442dc5]">AD</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[11px] font-semibold leading-4">Ananya Desai</div>
                  <div className="text-[10px] text-[#858d9b]">School admin</div>
                </div>
              </div>
              <MoreHorizontal className="size-4 text-[#858d9b]" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-[#e6e8ee] bg-white/95 px-4 backdrop-blur-sm sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[#858d9b]">
              <span className="lg:hidden font-semibold text-[#252a38]">EduSync</span>
              <span className="hidden lg:inline">Workspace</span>
              <span className="text-[#c1c5cf]">/</span>
              <span className="truncate font-medium text-[#343847]">Design system</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-[#dfe2e9] bg-white px-2.5 text-[12px] text-[#454c5b]" onClick={() => setIsDark((value) => !value)} aria-label={isDark ? "Use light theme" : "Use dark theme"}>
                {isDark ? <Sun /> : <Moon />}{isDark ? "Light" : "Dark"}
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-[#697386]" aria-label="Help"><CircleHelp /></Button>
              <Button variant="outline" size="sm" className="hidden h-8 gap-1.5 border-[#dfe2e9] bg-white text-[11px] text-[#454c5b] sm:inline-flex">
                <Download className="size-3.5" /> Export tokens
              </Button>
              <Avatar className="size-7 lg:hidden"><AvatarFallback className="bg-[#e8e4ff] text-[10px] font-semibold text-[#442dc5]">AD</AvatarFallback></Avatar>
            </div>
          </header>

          <div className="border-b border-[#e6e8ee] bg-white px-4 py-3 lg:hidden">
            <nav className="flex gap-1 overflow-x-auto" aria-label="Design sections">
              {navItems.map(({ id, label }) => (
                <a key={id} href={`#${id}`} onClick={() => setActiveSection(id)} className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${activeSection === id ? "bg-[#f0edff] text-[#442dc5]" : "text-[#697386] hover:bg-[#f4f5f8]"}`}>{label}</a>
              ))}
            </nav>
          </div>

          <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-7 lg:px-10">
            <section id="overview" className="scroll-mt-20 border-b border-[#e3e5eb] py-8 sm:py-10">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[#7161c7]">
                    <span className="size-1.5 rounded-full bg-[#6e5bd1]" /> PRODUCT LANGUAGE <span className="text-[#b3b7c1]">/</span> 01
                  </div>
                  <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.8px] sm:text-[32px]">Design system</h1>
                  <p className="mt-2 max-w-[560px] text-[13px] leading-5 text-[#6e7685]">A shared interface language for school operations: precise, legible, and calm under pressure.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="h-6 border-[#dfe2e9] bg-white px-2.5 text-[10px] font-medium text-[#687182]">Version 0.1</Badge>
                  <Button size="sm" onClick={saveDraft} disabled={isSaving} className="h-8 rounded-lg bg-[#442dc5] px-3 text-[11px] shadow-[0_3px_8px_rgba(68,45,197,0.14)] hover:bg-[#3822b2]">
                    {isSaving ? <LoaderCircle className="animate-spin" /> : <Check className="size-3.5" />}
                    {isSaving ? "Saving" : "Save changes"}
                  </Button>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#e5e7ed] bg-[#e5e7ed] sm:grid-cols-4">
                {[
                  { value: "4px", label: "Spacing base" },
                  { value: "12px", label: "Corner radius" },
                  { value: "150–250ms", label: "Motion" },
                  { value: "12h", label: "Time format" },
                ].map((item) => <div key={item.label} className="bg-white px-3 py-3.5 sm:px-4"><div className="font-mono text-[13px] font-semibold text-[#292d3a]">{item.value}</div><div className="mt-1 text-[10px] text-[#8a91a0]">{item.label}</div></div>)}
              </div>
              <div className="mt-6 border-t border-[#e6e8ee] pt-4">
                <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-semibold">Subject categories</h3><span className="font-mono text-[11px] uppercase text-[#596273]">Semantic accents</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { name: "STEM", subjects: "Science · Maths · Computer", swatch: "bg-sky-500", tint: "bg-sky-50 text-sky-900" },
                    { name: "Humanities", subjects: "English · Social Science", swatch: "bg-amber-500", tint: "bg-amber-50 text-amber-950" },
                    { name: "Electives", subjects: "Art · Music · Work Ed.", swatch: "bg-violet-500", tint: "bg-violet-50 text-violet-950" },
                    { name: "Sports", subjects: "Physical Education", swatch: "bg-emerald-600", tint: "bg-emerald-50 text-emerald-950" },
                  ].map((category) => <div key={category.name} className={`rounded-lg border border-black/5 p-3 ${category.tint}`}><div className="flex items-center gap-2 text-[14px] font-semibold"><span className={`size-2.5 rounded-sm ${category.swatch}`} />{category.name}</div><p className="mt-1 text-[12px]">{category.subjects}</p></div>)}
                </div>
                <p className="mt-2 text-[12px] text-[#596273]">Warning token: amber-700 on amber-50. Muted text uses Slate 600 or darker for AA contrast.</p>
              </div>
            </section>

            <section id="foundations" className="scroll-mt-20 border-b border-[#e3e5eb] py-8">
              <SectionHeading index="02" title="Foundations" detail="Color, type, spacing and the small decisions that make the interface feel consistent." />
              <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-semibold">Color tokens</h3><span className="text-[10px] text-[#8a91a0]">One neutral scale · semantic accents</span></div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {swatches.map((swatch) => <div key={swatch.name} className="min-w-0"><div className={`h-10 rounded-lg border border-black/[0.04] ${swatch.className}`} /><div className="mt-1.5 truncate text-[10px] font-medium text-[#51596a]">{swatch.name}</div><div className="font-mono text-[9px] text-[#969daa]">{swatch.value}</div></div>)}
                  </div>
                  <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-3 border-t border-[#eceef2] pt-4">
                    <span className="text-[25px] font-semibold tracking-[-0.8px]">Aa</span>
                    <span className="text-[16px] font-medium">One family, clear hierarchy</span>
                    <span className="text-[12px] text-[#7b8290]">Inter Tight · 12 / 14 / 16 / 24 / 32</span>
                    <span className="font-mono text-[12px] text-[#5140bd]">08:20 AM · P03</span>
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-semibold">Spacing scale</h3><span className="text-[10px] text-[#8a91a0]">4px base unit</span></div>
                  <div className="flex h-[76px] items-end gap-2 border-b border-[#e8eaf0] pb-2">
                    {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => <div key={size} className="flex flex-1 flex-col items-center gap-1"><div className="w-full max-w-8 rounded-t-[3px] bg-[#dcd6ff]" style={{ height: `${size}px` }} /><span className="font-mono text-[9px] text-[#8a91a0]">{size}</span></div>)}
                  </div>
                  <p className="mt-3 text-[11px] leading-4 text-[#798190]">Compact controls use 8–12px internal spacing. Group related information; reserve larger gaps for a change in context.</p>
                </div>
              </div>
            </section>

            <section id="components" className="scroll-mt-20 border-b border-[#e3e5eb] py-8">
              <SectionHeading index="03" title="Components" detail="The everyday controls for admins, teachers and students." />
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Specimen title="Actions" meta="BUTTONS · 32 / 36 / 40">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="h-9 rounded-lg bg-[#442dc5] px-3.5 text-xs hover:bg-[#3822b2]"><Plus /> Add period</Button>
                    <Button variant="outline" className="h-9 rounded-lg border-[#dfe2e9] bg-white px-3 text-xs text-[#414858] hover:bg-[#f7f7fa]"><Download /> Export</Button>
                    <Button variant="secondary" className="h-9 rounded-lg px-3 text-xs"><Filter /> Filter</Button>
                    <Button variant="ghost" size="icon" className="size-9 rounded-lg text-[#697386]" aria-label="More actions"><MoreHorizontal /></Button>
                    <Button className="h-9 rounded-lg bg-[#442dc5] px-3.5 text-xs" onClick={saveDraft} disabled={isSaving}>{isSaving ? <LoaderCircle className="animate-spin" /> : <CheckCheck />}{isSaving ? "Saving" : "Save draft"}</Button>
                    <Button className="h-9 rounded-lg bg-[#442dc5] px-3 text-xs" disabled><Plus /> Disabled</Button>
                  </div>
                  <p className="mt-3 text-[10px] text-[#9299a6]">Hover any action. Keyboard focus uses a visible indigo ring.</p>
                </Specimen>

                <Specimen title="Status & identity" meta="BADGES · AVATARS">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="h-6 rounded-full border border-[#cfe9dc] bg-[#edf8f2] px-2.5 text-[10px] font-medium text-[#18704f] hover:bg-[#edf8f2]">Covered</Badge>
                    <Badge className="h-6 rounded-full border border-[#f0dfb8] bg-[#fff8e9] px-2.5 text-[10px] font-medium text-[#946b16] hover:bg-[#fff8e9]">Needs cover</Badge>
                    <Badge className="h-6 rounded-full border border-[#f1d2d2] bg-[#fff1f1] px-2.5 text-[10px] font-medium text-[#aa3939] hover:bg-[#fff1f1]">Unassigned</Badge>
                    <Badge variant="outline" className="h-6 rounded-full border-[#dfe2e9] bg-white px-2.5 text-[10px] font-medium text-[#697386]">Draft</Badge>
                    <div className="ml-2 flex -space-x-2">
                      {teachers.map((teacher) => <Avatar key={teacher.initials} className="size-8 border-2 border-white"><AvatarFallback className={`text-[9px] font-semibold ${teacher.color}`}>{teacher.initials}</AvatarFallback></Avatar>)}
                    </div>
                    <span className="text-[10px] text-[#7e8695]">3 staff assigned</span>
                  </div>
                </Specimen>

                <Specimen title="Fields" meta="INPUT · SELECT · TEXTAREA">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5"><Label htmlFor="design-search" className="text-[11px]">Find a teacher</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 size-3.5 text-[#9198a6]" /><Input id="design-search" placeholder="Name or subject" className="h-9 rounded-lg border-[#e1e4eb] bg-white pl-8 text-xs placeholder:text-[#a2a8b3] focus-visible:ring-[#7966dc]" /></div></div>
                    <div className="space-y-1.5"><Label className="text-[11px]">Class section</Label><Select defaultValue="8-a"><SelectTrigger className="h-9 rounded-lg border-[#e1e4eb] bg-white text-xs focus:ring-[#7966dc]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="8-a">Grade 8 · Section A</SelectItem><SelectItem value="8-b">Grade 8 · Section B</SelectItem><SelectItem value="9-a">Grade 9 · Section A</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="design-note" className="text-[11px]">Admin note</Label><Textarea id="design-note" placeholder="Add a short note for the staff room…" className="min-h-[66px] resize-y rounded-lg border-[#e1e4eb] bg-white text-xs placeholder:text-[#a2a8b3] focus-visible:ring-[#7966dc]" /></div>
                  </div>
                </Specimen>

                <Specimen title="Selection & preferences" meta="CHECKBOX · SWITCH · TABS">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <label className="flex items-center gap-2 text-[11px] text-[#4d5564]"><Checkbox defaultChecked className="size-4 rounded-[4px] data-[state=checked]:bg-[#442dc5]" /> Include lab periods</label>
                    <label className="flex items-center gap-2 text-[11px] text-[#4d5564]"><Switch defaultChecked className="scale-[0.85] data-[state=checked]:bg-[#442dc5]" /> Notify staff</label>
                  </div>
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
                    <TabsList className="h-8 rounded-lg bg-[#f1f3f7] p-0.5">
                      <TabsTrigger value="all" className="h-7 rounded-md px-3 text-[10px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm">All periods</TabsTrigger>
                      <TabsTrigger value="cover" className="h-7 rounded-md px-3 text-[10px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm">Substitutions</TabsTrigger>
                      <TabsTrigger value="free" className="h-7 rounded-md px-3 text-[10px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm">Free staff</TabsTrigger>
                    </TabsList>
                    <TabsContent value={selectedTab} className="mt-2 text-[10px] text-[#858d9b]">Selected view: {selectedTab === "all" ? "All periods" : selectedTab === "cover" ? "Substitutions" : "Free staff"}</TabsContent>
                  </Tabs>
                </Specimen>
              </div>
            </section>

            <section id="data-display" className="scroll-mt-20 border-b border-[#e3e5eb] py-8">
              <SectionHeading index="04" title="Data display" detail="Readable at a glance, with time, class and change status easy to scan." />
              <div className="mt-6 overflow-hidden rounded-xl border border-[#e4e6ec] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaf0] px-4 py-3">
                  <div><h3 className="text-[12px] font-semibold">Monday, 12 October</h3><p className="mt-0.5 text-[10px] text-[#8a91a0]">Grade 8-A · 6 periods</p></div>
                  <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-7 rounded-md border-[#e1e4eb] bg-white px-2.5 text-[10px] text-[#60697a]"><CalendarDays /> Today</Button><Button variant="outline" size="icon" className="size-7 rounded-md border-[#e1e4eb] bg-white text-[#60697a]" aria-label="More timetable options"><MoreHorizontal /></Button></div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="border-[#eceef2] hover:bg-transparent"><TableHead className="w-[116px] pl-4 text-[9px] font-semibold uppercase tracking-[0.7px] text-[#9198a6]">Time</TableHead><TableHead className="text-[9px] font-semibold uppercase tracking-[0.7px] text-[#9198a6]">Class / subject</TableHead><TableHead className="text-[9px] font-semibold uppercase tracking-[0.7px] text-[#9198a6]">Teacher</TableHead><TableHead className="hidden text-[9px] font-semibold uppercase tracking-[0.7px] text-[#9198a6] sm:table-cell">Room</TableHead><TableHead className="pr-4 text-[9px] font-semibold uppercase tracking-[0.7px] text-[#9198a6]">Status</TableHead></TableRow></TableHeader>
                    <TableBody>{scheduleRows.map((row) => <TableRow key={row.period} className="border-[#eff0f4] transition-colors hover:bg-[#fafaff]"><TableCell className="pl-4"><div className="font-mono text-[10px] font-medium text-[#343847]">{row.time}</div><div className="mt-0.5 font-mono text-[9px] text-[#9ba1ad]">P{row.period}</div></TableCell><TableCell><div className="text-[11px] font-medium text-[#343847]">{row.className} <span className="px-1 text-[#c0c4cd]">/</span> {row.subject}</div></TableCell><TableCell className="text-[11px] text-[#697386]">{row.teacher}</TableCell><TableCell className="hidden text-[11px] text-[#697386] sm:table-cell">{row.room}</TableCell><TableCell className="pr-4">{row.status === "Substitute" ? <Badge className="h-5 rounded-full border border-[#e3defd] bg-[#f3f0ff] px-2 text-[9px] font-medium text-[#5140bd] hover:bg-[#f3f0ff]">Cover assigned</Badge> : <span className="inline-flex items-center gap-1.5 text-[10px] text-[#687182]"><span className="size-1.5 rounded-full bg-[#18845b]" />On time</span>}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t border-[#eceef2] px-4 py-2.5"><span className="text-[10px] text-[#8991a0]">Showing 3 of 6 periods</span><Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-[#5140bd] hover:bg-[#f5f3ff]">View schedule <ArrowRight /></Button></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {teachers.map((teacher) => <div key={teacher.name} className="flex items-center gap-2.5 border-y border-[#e7e9ef] py-3"><Avatar className="size-8"><AvatarFallback className={`text-[9px] font-semibold ${teacher.color}`}>{teacher.initials}</AvatarFallback></Avatar><div className="min-w-0"><div className="truncate text-[11px] font-medium">{teacher.name}</div><div className="mt-0.5 truncate text-[10px] text-[#858d9b]">{teacher.subject}</div></div><span className="ml-auto shrink-0 font-mono text-[9px] text-[#858d9b]">4/6</span></div>)}
              </div>
            </section>

            <section id="states" className="scroll-mt-20 py-8">
              <SectionHeading index="05" title="States & feedback" detail="Every workflow should explain what is happening, what changed, and what to do next." />
              {showNotice && <Alert className="mt-6 rounded-xl border-[#dcd6ff] bg-[#f5f3ff] px-4 py-3 text-[#332487]"><Sparkles className="size-4 text-[#6654cc]" /><AlertTitle className="text-[11px] font-semibold text-[#332487]">Substitution plan is ready</AlertTitle><AlertDescription className="mt-0.5 text-[10px] text-[#625a89]">3 periods have cover assigned. Review the changes before sharing with staff.</AlertDescription><button onClick={() => setShowNotice(false)} className="absolute right-3 top-3 rounded p-1 text-[#6d6690] transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7966dc]" aria-label="Dismiss notice"><Check className="size-3.5" /></button></Alert>}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#e4e6ec] bg-white p-4"><div className="flex items-center gap-2 text-[11px] font-semibold"><LoaderCircle className="size-3.5 animate-spin text-[#6654cc]" /> Loading schedule</div><div className="mt-4 space-y-2.5"><Skeleton className="h-3 w-2/3 bg-[#eff0f4]" /><Skeleton className="h-3 w-full bg-[#eff0f4]" /><Skeleton className="h-3 w-4/5 bg-[#eff0f4]" /></div><div className="mt-3 text-[10px] text-[#8991a0]">Fetching the latest timetable…</div></div>
                <div className="rounded-xl border border-[#e4e6ec] bg-white p-4"><div className="flex items-center gap-2 text-[11px] font-semibold"><CalendarDays className="size-3.5 text-[#7d8594]" /> No requests today</div><p className="mt-2 text-[10px] leading-4 text-[#7c8492]">Teacher requests will appear here when submitted.</p><Button variant="outline" size="sm" className="mt-3 h-7 rounded-md border-[#e1e4eb] bg-white text-[10px] text-[#555d6d]">Open requests</Button></div>
                <div className="rounded-xl border border-[#f0d7d7] bg-white p-4"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#8e3535]"><WifiOff className="size-3.5" /> Could not sync changes</div><p className="mt-2 text-[10px] leading-4 text-[#7c8492]">Your draft is saved on this device. Check your connection and retry.</p><Button variant="outline" size="sm" className="mt-3 h-7 rounded-md border-[#ead1d1] bg-white text-[10px] text-[#9d3b3b] hover:bg-[#fff6f6]"><ArrowDown /> Try again</Button></div>
              </div>
              <div className="mt-4 grid gap-5 border-t border-[#e7e9ef] pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="flex items-center justify-between text-[10px]"><span className="font-medium text-[#4a5160]">Daily coverage</span><span className="font-mono text-[#697386]">5 of 6 periods</span></div><Progress value={83} className="mt-2 h-1.5 bg-[#e9eaf0] [&>div]:bg-[#5540c9]" /><p className="mt-1.5 text-[9px] text-[#9299a6]">One period needs a substitute assignment.</p></div>
                <div className="flex items-center gap-2"><Clock3 className="size-3.5 text-[#7d8594]" /><span className="font-mono text-[10px] text-[#454c5a]">Next bell · 09:40 AM</span><AlertCircle className="ml-1 size-3.5 text-[#b5841b]" /></div>
              </div>
              <div className="mt-8 border-t border-[#e3e5eb] pt-6">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"><span className="font-mono text-[11px] text-[#596273]">06</span><h2 className="text-[17px] font-semibold tracking-[-0.35px]">Timetable components</h2><p className="text-[12px] text-[#596273]">Reusable building blocks for daily operations.</p></div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Specimen title="Timetable cells" meta="NORMAL · COVER · FORCED · LOCKED · FREE · HOLIDAY">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        { subject: "Science", teacher: "Aarav Mehta", qualification: "PGT" as const, room: "Lab 02", category: "stem" as const },
                        { subject: "Mathematics", teacher: "Nisha Rao", qualification: "TGT" as const, room: "Room 14", category: "stem" as const, variant: "cover" as const, absentTeacher: "Vikram Shah" },
                        { subject: "English", teacher: "Riya Sen", qualification: "TGT" as const, room: "Room 08", category: "humanities" as const, variant: "forced" as const },
                        { subject: "Computer", teacher: "Karan Das", qualification: "PGT" as const, room: "IT Lab", category: "electives" as const, variant: "locked" as const },
                        { subject: "", teacher: "", qualification: "TGT" as const, room: "", category: "sports" as const, variant: "free" as const },
                        { subject: "", teacher: "", qualification: "TGT" as const, room: "", category: "sports" as const, variant: "holiday" as const, holidayName: "Gandhi Jayanti" },
                      ].map((cell, index) => <TimetableCell key={`${cell.variant ?? "normal"}-${index}`} data={cell} />)}
                    </div>
                  </Specimen>
                  <Specimen title="Summary & workload" meta="METRIC · COVERAGE · NOW / NEXT">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"><MetricCard label="Periods placed" value="48 / 48" detail="Across 6 school days" /><CoverageRing value={100} /></div>
                    <div className="mt-3"><NowNextCard now={{ period: "P3", time: "09:40–10:20 AM", subject: "Science", room: "Lab 02" }} next={{ period: "P4", time: "10:20–11:00 AM", subject: "English", room: "Room 08" }} /></div>
                  </Specimen>
                  <Specimen title="Overlays & commands" meta="DRAWER · DIALOG · COMMAND MENU">
                    <div className="flex flex-wrap gap-2"><Button variant="outline" className="h-9 rounded-lg bg-white text-[12px]" onClick={() => setIsDrawerOpen(true)}>Open drawer</Button><Button variant="outline" className="h-9 rounded-lg bg-white text-[12px]" onClick={() => setIsDialogOpen(true)}>Open dialog</Button><Button variant="outline" className="h-9 rounded-lg bg-white text-[12px]" onClick={() => setIsCommandOpen(true)}>Command menu <span className="ml-1 font-mono text-[11px]">⌘K</span></Button></div>
                    <div className="mt-3"><Toast title="Timetable saved" description="Your changes are ready to share with staff." /></div>
                  </Specimen>
                </div>
              </div>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} title="Period details" description="Class 10-A · Monday · Period 3"><p className="text-[14px] font-semibold">Science</p><p className="mt-1 text-[12px] text-[#596273]">Aarav Mehta · Lab 02 · 4 periods today</p><Button className="mt-5 h-9 rounded-lg bg-[#442dc5] text-[12px]">Edit period</Button></Drawer>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="Publish timetable" description="This makes the approved routine visible to teachers and students."><div className="flex justify-end gap-2"><Button variant="outline" className="h-9 rounded-lg text-[12px]" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button className="h-9 rounded-lg bg-[#442dc5] text-[12px]" onClick={() => setIsDialogOpen(false)}>Publish</Button></div></Dialog>
              <CommandMenu open={isCommandOpen} onOpenChange={setIsCommandOpen} items={[{ label: "Generate timetable", detail: "⌘ G", onSelect: () => toast("Generation queued") }, { label: "Open teacher workload", onSelect: () => toast("Teacher workload opened") }, { label: "Switch to Class 10-A", onSelect: () => toast("Class selected") }]} />
            </section>

            <footer className="flex flex-col gap-2 border-t border-[#e3e5eb] pt-4 text-[10px] text-[#939aa7] sm:flex-row sm:items-center sm:justify-between">
              <span>EduSync interface foundations · Built for school operations in India</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#18845b]" />Reduced-motion aware · Keyboard accessible</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3"><span className="font-mono text-[10px] text-[#a0a6b2]">{index}</span><h2 className="text-[17px] font-semibold tracking-[-0.35px]">{title}</h2><p className="text-[11px] text-[#838b99]">{detail}</p></div>;
}

function Specimen({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return <div className="min-w-0 border-t border-[#e5e7ed] pt-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[12px] font-semibold">{title}</h3><span className="font-mono text-[9px] tracking-[0.3px] text-[#969daa]">{meta}</span></div>{children}</div>;
}