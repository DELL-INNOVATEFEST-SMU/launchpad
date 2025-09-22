"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminAuth } from "@/app/actions/admin-auth";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGate({
  children,
  fallback,
  redirectTo = "/",
}: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authResult = await checkAdminAuth();
        setIsAuthenticated(authResult);

        if (!authResult) {
          router.push(redirectTo);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        setIsAuthenticated(false);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, redirectTo]);

  if (isLoading) {
    return fallback || <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect, so don't render anything
  }

  return <>{children}</>;
}
