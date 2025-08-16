import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user)
      return new NextResponse("Unauthorized", { status: 401 });

    const uid = user.id;

    // 2) Admin client with service-role (server-only key!)
    const admin = createClient(
      process.env.SUPABASE_URL!, // <-- not NEXT_PUBLIC
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // <-- server-only
      { auth: { persistSession: false } }
    );

    try {
      // 3) Delete app data (adjust table names if yours differ)
      await admin
        .from("friendships")
        .delete()
        .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
      await admin.from("leaderboard_members").delete().eq("user_id", uid);
      await admin.from("scores").delete().eq("uid", uid);
      await admin.from("contact_messages").delete().eq("sender_id", uid);
      await admin.from("contact_threads").delete().eq("user_id", uid);
      await admin.from("profiles").delete().eq("id", uid);

      // 4) Delete auth user
      await admin.auth.admin.deleteUser(uid);

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      console.error("Delete account failed:", e);
      return new NextResponse(e?.message || "Delete failed", { status: 500 });
    }
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
