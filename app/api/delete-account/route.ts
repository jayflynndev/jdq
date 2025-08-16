import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify JWT with anon client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const uid = user.id;

    // Admin client (server-only service role key)
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Delete app data via Postgres function
    const { error: cascadeError } = await admin.rpc("delete_user_cascade", {
      p_uid: uid,
    });

    if (cascadeError) {
      console.error("Cascade delete failed:", cascadeError);
      return new NextResponse(cascadeError.message, { status: 500 });
    }

    // 2. Delete the auth user
    const { error: authError } = await admin.auth.admin.deleteUser(uid);
    if (authError) {
      console.error("Auth delete failed:", authError);
      return new NextResponse(authError.message, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Unexpected delete error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
