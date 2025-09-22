import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/app/actions/admin-auth";

/**
 * Server-side authentication check with automatic redirect
 * Use this in server components and page components
 */
export async function requireAuth(redirectTo: string = "/") {
  const isAuthenticated = await checkAdminAuth();
  
  if (!isAuthenticated) {
    redirect(redirectTo);
  }
  
  return true;
}

/**
 * Server-side authentication check without redirect
 * Use this when you need to conditionally render content
 */
export async function getAuthStatus(): Promise<boolean> {
  return await checkAdminAuth();
}
