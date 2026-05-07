// =====================================================================
// Clerk user lookup helpers.
// =====================================================================

import { clerkClient } from "@clerk/nextjs/server";

export interface BasicClerkUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export async function getBasicUser(userId: string): Promise<BasicClerkUser | null> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch {
    return null;
  }
}
