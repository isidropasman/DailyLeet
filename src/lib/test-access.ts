import { clerkClient } from "@clerk/nextjs/server";
import { revalidateTag, unstable_cache } from "next/cache";

async function lookup(userId: string): Promise<boolean> {
  const user = await (await clerkClient()).users.getUser(userId);
  if (user.privateMetadata.dailyleetTester === true) return true;
  const email = process.env.DAILYLEET_TESTER_EMAIL?.trim().toLowerCase();
  const primary = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId);
  return Boolean(email && primary?.verification?.status === "verified" && primary.emailAddress.toLowerCase() === email);
}

const tag = (userId: string) => `test-access:${userId}`;

// Every signed-in GET asks this; uncached it's one Clerk Backend API call per page load,
// which hits Clerk's rate limit long before our DB struggles. Reads lag ≤5 min; writes
// (fresh: true) re-check Clerk and expire the cached answer so a revocation shows up on the next GET.
export async function hasTestAccess(userId: string | null, options: { fresh?: boolean } = {}): Promise<boolean> {
  if (!userId) return false;
  if (!options.fresh) return unstable_cache(lookup, ["test-access", userId], { tags: [tag(userId)], revalidate: 300 })(userId);
  const allowed = await lookup(userId);
  revalidateTag(tag(userId), { expire: 0 });
  return allowed;
}
