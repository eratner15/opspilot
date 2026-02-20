import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return {
    id: userId,
    organizationId: orgId ?? "",
    email: user?.emailAddresses[0]?.emailAddress ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function getOrganizationId(): Promise<string> {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error("No organization found. Please select an organization.");
  }
  return orgId;
}
