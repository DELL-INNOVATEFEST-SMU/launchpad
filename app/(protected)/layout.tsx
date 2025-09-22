import { requireAuth } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";

/**
 * Protected Layout
 * This layout automatically checks authentication for all routes within the (protected) group
 * and redirects to login if the user is not authenticated
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to login if not authenticated
  await requireAuth();

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
