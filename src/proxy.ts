import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/documents(.*)",
  "/templates(.*)",
  "/workflows(.*)",
  "/chats(.*)",
  "/integrations(.*)",
  "/settings(.*)",
]);

const isApiRoute = createRouteMatcher([
  "/api/:path*",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
    return;
  }

  if (
    req.nextUrl.pathname.match(/^\/api\/documents\/[^/]+\/process$/) &&
    req.headers.get("x-internal-trigger") === "1"
  ) {
    return;
  }

  if (isApiRoute(req) && !isPublicApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
