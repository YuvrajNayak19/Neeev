import { Loader2, School } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Panel } from "@/components/app/bits";
import { Field, FormAlert, PasswordField, validators } from "@/components/app/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChangePassword, useUpdateProfile } from "@/lib/api";
import { appRoleFromUser } from "@/lib/auth-api";
import { displayName, useMe } from "@/lib/session";

const ROLE_LABEL = { admin: "School administrator", teacher: "Teacher", student: "Student" } as const;

export function AccountPage() {
  const me = useMe();
  const update = useUpdateProfile();
  const changePassword = useChangePassword();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!me.data) return;
    setName(displayName(me.data) === "there" ? "" : displayName(me.data));
    setPhone(me.data.user.profile?.phone ?? "");
  }, [me.data]);

  const role = me.data ? appRoleFromUser(me.data.user) : null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    const nameError = validators.name(name);
    if (nameError) return setProfileError(nameError);
    if (phone && phone.replace(/\D/g, "").length < 10) return setProfileError("Enter a 10-digit phone number, or leave it empty.");
    try {
      await update.mutateAsync({ name: name.trim(), phone: phone.trim() });
      toast.success("Profile saved");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save your profile.");
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (!current) return setPasswordError("Enter your current password.");
    const nextError = validators.password(next);
    if (nextError) return setPasswordError(`New password: ${nextError.toLowerCase()}`);
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      toast.success("Password changed", { description: "Use your new password next time you sign in." });
      setCurrent(""); setNext("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Could not change your password.");
    }
  };

  return (
    <>
      <PageHeader title="Profile & settings" description="How you appear in ClassSync, and how you sign in." />
      {me.isLoading || !me.data ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="h-fit rounded-2xl border border-line bg-paper p-6 text-center shadow-soft">
            <Avatar name={displayName(me.data)} size="lg" className="mx-auto" />
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">{displayName(me.data)}</h2>
            <p className="text-sm text-ink-muted">{role ? ROLE_LABEL[role] : ""}{me.data.student?.classSectionId ? ` · Class ${me.data.student.classSectionId.grade}-${me.data.student.classSectionId.section}` : ""}{me.data.teacher ? ` · ${me.data.teacher.qualificationCategory}` : ""}</p>
            <p className="mt-1 text-sm text-ink-muted">{me.data.user.email ?? me.data.user.admissionNumber}</p>
            {me.data.school ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-peach-50 p-3 text-left">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-peach-200 text-plum"><School className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{me.data.school.name}</p>
                  <p className="truncate text-xs text-ink-muted">{me.data.school.city}{me.data.school.board ? ` · ${me.data.school.board}` : ""}{me.data.school.code ? ` · Code ${me.data.school.code}` : ""}</p>
                </div>
              </div>
            ) : null}
          </section>

          <div className="space-y-6">
            <Panel title="Your details">
              <form noValidate onSubmit={(event) => void saveProfile(event)} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
                <Field label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="98765 43210" hint={role !== "student" ? "Staff can sign in with this number too." : undefined} />
                {profileError ? <div className="sm:col-span-2"><FormAlert>{profileError}</FormAlert></div> : null}
                <div className="sm:col-span-2"><Button type="submit" disabled={update.isPending}>{update.isPending ? <><Loader2 className="animate-spin" />Saving…</> : "Save details"}</Button></div>
              </form>
            </Panel>
            <Panel title="Change password">
              <form noValidate onSubmit={(event) => void savePassword(event)} className="grid gap-4 sm:grid-cols-2">
                <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
                <PasswordField label="New password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} hint="At least 8 characters." />
                {passwordError ? <div className="sm:col-span-2"><FormAlert>{passwordError}</FormAlert></div> : null}
                <div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={changePassword.isPending}>{changePassword.isPending ? <><Loader2 className="animate-spin" />Updating…</> : "Update password"}</Button></div>
              </form>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
