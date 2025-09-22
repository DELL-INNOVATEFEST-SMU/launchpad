import Navbar from "@/components/Navbar";

/**
 * Protected Layout
 * Authentication is handled by middleware.ts at the edge level
 * This layout just provides the navigation and structure for protected routes
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
