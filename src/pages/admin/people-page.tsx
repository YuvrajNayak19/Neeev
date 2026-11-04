import { Check, Loader2, MoreHorizontal, Search, UserMinus, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Field, FormAlert, PasswordField, validators } from "@/components/app/form-field";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClasses, useCreatePerson, usePeople, useSetPersonStatus, type Person } from "@/lib/api";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "TEACHER" | "STUDENT" | "PENDING";

const ROLE_LABEL: Record<Person["role"], string> = { SUPER_ADMIN: "Admin", SCHOOL_ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" };

function StatusBadge({ status }: { status: Person["status"] }) {
  if (status === "ACTIVE") return <Badge variant="success" dot>Active</Badge>;
  if (status === "PENDING") return <Badge variant="warning" dot>Waiting for approval</Badge>;
  return <Badge variant="secondary" dot>Deactivated</Badge>;
}

function detailOf(person: Person) {
  if (person.role === "STUDENT") return [person.className && `Class ${person.className}`, person.admissionNumber].filter(Boolean).join(" · ");
  if (person.role === "TEACHER") return [person.subjects.join(", "), person.category].filter(Boolean).join(" · ") || person.email;
  return person.email;
}

export function PeoplePage() {
  const people = usePeople();
  const setStatus = useSetPersonStatus();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const filter = (params.get("status") === "PENDING" ? "PENDING" : params.get("role") ?? "all") as RoleFilter;
  const setFilter = (value: RoleFilter) => setParams(value === "all" ? {} : value === "PENDING" ? { status: "PENDING" } : { role: value }, { replace: true });

  const all = people.data ?? [];
  const pendingCount = all.filter((person) => person.status === "PENDING").length;
  const needle = query.trim().toLowerCase();
  const list = all
    .filter((person) => (filter === "all" ? true : filter === "PENDING" ? person.status === "PENDING" : person.role === filter))
    .filter((person) => !needle || [person.name, person.email, person.admissionNumber, person.className, person.phone, ...person.subjects].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING") || a.name.localeCompare(b.name));

  const change = (person: Person, status: "ACTIVE" | "SUSPENDED") => {
    setStatus.mutate(
      { id: person.id, status, pending: person.status === "PENDING" },
      {
        onSuccess: () => toast.success(status === "ACTIVE" ? (person.status === "PENDING" ? `${person.name} approved` : `${person.name} reactivated`) : `${person.name} deactivated`, { description: status === "ACTIVE" ? "They can sign in now." : "They can no longer sign in." }),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const actionsFor = (person: Person) => {
    if (person.isSelf || person.role === "SCHOOL_ADMIN" || person.role === "SUPER_ADMIN") return null;
    if (person.status === "PENDING") {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => change(person, "ACTIVE")} disabled={setStatus.isPending}><Check />Approve</Button>
          <Button size="sm" variant="ghost" onClick={() => change(person, "SUSPENDED")} disabled={setStatus.isPending}>Decline</Button>
        </div>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${person.name}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {person.status === "ACTIVE" ? (
            <DropdownMenuItem onSelect={() => change(person, "SUSPENDED")} className="text-brick focus:text-brick"><UserMinus className="h-4 w-4" />Deactivate account</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => change(person, "ACTIVE")}><UserRoundCheck className="h-4 w-4" />Reactivate account</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <PageHeader title="People" description="Teachers and students who can sign in to your school's ClassSync." actions={<AddPersonDialog />} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as RoleFilter)}>
          <TabsList aria-label="Filter people">
            <TabsTrigger value="all">Everyone</TabsTrigger>
            <TabsTrigger value="TEACHER">Teachers</TabsTrigger>
            <TabsTrigger value="STUDENT">Students</TabsTrigger>
            <TabsTrigger value="PENDING">To approve {pendingCount ? <span className="rounded-full bg-plum px-1.5 text-2xs text-cream">{pendingCount}</span> : null}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Label htmlFor="people-search" className="sr-only">Search people</Label>
          <Input id="people-search" className="h-10 pl-10" placeholder="Search by name, class, subject…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      {people.isLoading ? <ListSkeleton rows={6} /> : people.error ? <ErrorState error={people.error} onRetry={() => void people.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={Users} title={needle ? `No one matches “${query}”` : filter === "PENDING" ? "No sign-ups waiting" : "No people yet"} description={needle ? "Check the spelling or try a class like 8-A." : filter === "PENDING" ? "New teacher and student sign-ups appear here for approval." : "Add teachers and students so they can sign in."} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-paper shadow-soft md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((person) => (
                  <TableRow key={person.id} className={cn(person.status === "PENDING" && "bg-honey-bg/30")}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={person.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{person.name}{person.isSelf ? <span className="ml-1.5 text-xs font-medium text-ink-muted">(you)</span> : null}</p>
                          <p className="truncate text-xs text-ink-muted">{person.email || person.admissionNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink">{ROLE_LABEL[person.role]}</TableCell>
                    <TableCell className="max-w-[18rem] truncate text-ink-muted">{detailOf(person)}</TableCell>
                    <TableCell><StatusBadge status={person.status} /></TableCell>
                    <TableCell className="text-right">{actionsFor(person)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-2.5 md:hidden">
            {list.map((person) => (
              <li key={person.id} className={cn("rounded-2xl border border-line bg-paper p-4 shadow-soft", person.status === "PENDING" && "border-honey/30")}>
                <div className="flex items-start gap-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{person.name}</p>
                    <p className="truncate text-sm text-ink-muted">{ROLE_LABEL[person.role]} · {detailOf(person)}</p>
                    <div className="mt-2"><StatusBadge status={person.status} /></div>
                  </div>
                  {person.status !== "PENDING" ? actionsFor(person) : null}
                </div>
                {person.status === "PENDING" ? <div className="mt-3 border-t border-line pt-3">{actionsFor(person)}</div> : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">Showing {list.length} of {all.length} people</p>
        </>
      )}
    </>
  );
}

function AddPersonDialog() {
  const classes = useClasses();
  const create = useCreatePerson();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [classSectionId, setClassSectionId] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: validators.name(name),
    email: role === "TEACHER" ? validators.email(email) : undefined,
    admissionNumber: role === "STUDENT" ? validators.required("the admission number")(admissionNumber) : undefined,
    classSectionId: role === "STUDENT" && !classSectionId ? "Choose a class." : undefined,
    password: validators.password(password),
  };
  const show = (key: keyof typeof errors) => (touched ? errors[key] : undefined);
  const reset = () => { setName(""); setEmail(""); setAdmissionNumber(""); setClassSectionId(""); setPassword(""); setTouched(false); setError(null); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await create.mutateAsync(role === "TEACHER" ? { role, name: name.trim(), email: email.trim(), password } : { role, name: name.trim(), admissionNumber: admissionNumber.trim(), classSectionId, password });
      toast.success(`${name.trim()} added`, { description: "Share the temporary password with them. They'll be asked to change it." });
      reset();
      setOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not add this person.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild><Button><UserPlus />Add a person</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a teacher or student</DialogTitle>
          <DialogDescription>Their account is active straight away.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["TEACHER", "STUDENT"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={role === value} onClick={() => { setRole(value); setTouched(false); }} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold", role === value ? "border-plum bg-plum-50 text-plum" : "border-line-strong text-ink-muted")}>
                {value === "TEACHER" ? "Teacher" : "Student"}
              </button>
            ))}
          </div>
          <Field label="Full name" value={name} onChange={(event) => setName(event.target.value)} error={show("name")} placeholder={role === "TEACHER" ? "e.g. Pooja Saxena" : "e.g. Arjun Khanna"} />
          {role === "TEACHER" ? (
            <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={show("email")} placeholder="name@school.in" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-class">Class</Label>
                <Select value={classSectionId} onValueChange={setClassSectionId}>
                  <SelectTrigger id="new-class" aria-invalid={show("classSectionId") ? true : undefined}><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{(classes.data ?? []).map((item) => <SelectItem key={item._id} value={item._id}>{item.grade}-{item.section}</SelectItem>)}</SelectContent>
                </Select>
                {show("classSectionId") ? <p className="text-xs font-medium text-brick">{show("classSectionId")}</p> : null}
              </div>
              <Field label="Admission no." value={admissionNumber} onChange={(event) => setAdmissionNumber(event.target.value.toUpperCase())} error={show("admissionNumber")} placeholder="e.g. A2301" />
            </div>
          )}
          <PasswordField label="Temporary password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={show("password")} hint="At least 8 characters." />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <><Loader2 className="animate-spin" />Adding…</> : "Add person"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
