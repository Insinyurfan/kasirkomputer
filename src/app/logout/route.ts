import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

function clearAndRedirect(req: NextRequest) {
  // 303 so the browser follows with a GET (not a re-POST) to /login.
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export function POST(req: NextRequest) {
  return clearAndRedirect(req);
}

export function GET(req: NextRequest) {
  return clearAndRedirect(req);
}
