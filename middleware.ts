// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";

  // Force https and www
  if (proto !== "https" || !host.startsWith("www.")) {
    const url = new URL(req.url);
    url.protocol = "https:";
    url.host = host.startsWith("www.") ? host : `www.${host}`;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/health|static|favicon.ico).*)"],
};
