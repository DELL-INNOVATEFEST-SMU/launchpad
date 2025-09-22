"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface AdminCredentials {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server action to authenticate admin credentials using Supabase Auth
 * This approach uses Supabase's built-in authentication system with role-based access
 */
export async function adminLogin(credentials: AdminCredentials): Promise<AuthResult> {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error("Supabase auth error:", error);
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Authentication failed",
      };
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      // Sign out the user if they don't have admin role
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Access denied. Admin privileges required.",
      };
    }

    // Set secure admin session cookie with Supabase session
    const cookieStore = await cookies();
    cookieStore.set("admin_session", data.session?.access_token || "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Admin authentication error:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

/**
 * Server action to check if user is authenticated as admin
 */
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession?.value) return false;

    // Verify the session with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.getUser(adminSession.value);

    if (error || !user) return false;

    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch (error) {
    console.error("Admin auth check error:", error);
    return false;
  }
}

/**
 * Server action to logout admin
 */
export async function adminLogout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (adminSession?.value) {
      // Sign out from Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.auth.signOut();
    }

    cookieStore.delete("admin_session");
  } catch (error) {
    console.error("Admin logout error:", error);
  }
}