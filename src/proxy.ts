import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk initializes request authentication here, while authorization remains
// colocated with each protected resource. The authenticated app layout gates
// browser pages, requireWorkspace() gates session APIs, and the webhook,
// readiness, and MCP routes enforce their own purpose-specific credentials.
// This avoids deprecated path-matcher authorization that can drift from the
// Next.js route tree.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
