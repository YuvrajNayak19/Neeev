import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuth, displayName } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile } from "@/lib/cloud";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Timely Substitution App" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Manage your Timely account settings and profile information.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [studentPasscode, setStudentPasscode] = useState("");

  useEffect(() => {
    if (loading || !user) return;

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile(user.id);
        if (profile) {
          setFullName(profile.fullName);
          setSchoolName(profile.schoolName);
          setSchoolId(profile.schoolId);
          setStudentPasscode(profile.studentPasscode);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
  }, [user, loading]);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [user, loading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await upsertProfile(user.id, { fullName, schoolName, schoolId, studentPasscode });
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-primary bg-background px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Profile Section */}
          <section className="rounded-lg border border-primary bg-background p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Profile</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ""} disabled className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">Cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="school">School name</Label>
                <Input
                  id="school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your school name"
                />
              </div>

              <div>
                <Label htmlFor="school-id">School ID</Label>
                <Input
                  id="school-id"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
                  className="mt-1"
                  placeholder="SCH-123456"
                />
              </div>

              <div>
                <Label htmlFor="student-passcode">Student Access Passcode</Label>
                <Input
                  id="student-passcode"
                  type="password"
                  value={studentPasscode}
                  onChange={(e) => setStudentPasscode(e.target.value)}
                  className="mt-1"
                  placeholder="Enter the student passcode"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </p>
              )}

              <Button onClick={() => void handleSave()} disabled={busy} className="w-full">
                {busy ? <Loader2 className="animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </section>

          {/* Account Section */}
          <section className="rounded-lg border border-primary bg-background p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Account</h2>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <strong>{user.email}</strong>
              </p>

              <Button variant="destructive" className="w-full" onClick={() => void handleLogout()}>
                Sign out
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
