import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    // Server-only client with SERVICE_ROLE key
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, // same URL
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // NOT anon
      { auth: { persistSession: false } }
    );

    // Validate user from token
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      return new NextResponse("Unauthorized", { status: 401 });

    const uid = user.id;

    // Do it all in a transaction (via RPC)
    const { error: rpcErr } = await admin.rpc("delete_user_cascade", {
      p_uid: uid,
    });
    if (rpcErr) {
      console.error("Cascade RPC failed:", rpcErr);
      return new NextResponse(rpcErr.message, { status: 500 });
    }

    // Finally, delete from auth
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error("Auth delete failed:", delErr);
      return new NextResponse(delErr.message, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Delete route error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
