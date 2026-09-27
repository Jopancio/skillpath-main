import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  // Page access only. AI route handlers retain their own 401 authorization.
  // The bare /courses catalog is a guest preview (read-only, greyed out);
  // every course detail page (/courses/<id>) and the rest stay protected.
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  if (path === "/courses") return;
  if (/^\/(courses|learn|quiz|certificate|dashboard|leaderboard|profile|badges|settings|mindmap|simulations)(\/|$)/.test(request.nextUrl.pathname)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/login", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
