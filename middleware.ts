// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const url = new URL(req.url);

  // Allow dev & preview environments to pass through unchanged
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isVercelPreview = host.endsWith(".vercel.app");
  if (isLocalhost || isVercelPreview) return NextResponse.next();

  // Force https and www
  const needsHttps = proto !== "https";
  const needsWww = !host.startsWith("www.");

  if (needsHttps || needsWww) {
    url.protocol = "https:";
    url.host = needsWww ? `www.${host}` : host;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Don’t run on Next assets or API health checks
export const config = {
  matcher: ["/((?!_next|static|favicon.ico|robots.txt|sitemap.xml).*)"],
};
