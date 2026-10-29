import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  schoolId?: unknown;
  passcode?: unknown;
  date?: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId.trim().toUpperCase() : "";
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";

  if (!schoolId || !passcode || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "School ID, passcode, and a valid date are required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase service configuration.");
    return json({ error: "Student schedule service is not configured." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("student_passcode")
    .eq("school_id", schoolId)
    .maybeSingle();

  if (profileError) {
    console.error("Student access lookup failed:", profileError);
    return json({ error: "Could not verify student access." }, 500);
  }

  if (!profile || profile.student_passcode !== passcode) {
    return json({ error: "That School ID and Student Passcode do not match." }, 401);
  }

  const { data: substitutions, error: substitutionsError } = await admin
    .from("substitutions")
    .select(
      "school_id, date, period, class_name, original_teacher_id, original_teacher_name, substitute_teacher_id, substitute_teacher_name, status",
    )
    .eq("school_id", schoolId)
    .eq("date", date)
    .in("status", ["assigned", "overridden"])
    .not("substitute_teacher_id", "is", null)
    .order("period")
    .order("class_name");

  if (substitutionsError) {
    console.error("Student schedule lookup failed:", substitutionsError);
    return json({ error: "Could not load the student schedule." }, 500);
  }

  return json({ substitutions: substitutions ?? [] });
});
