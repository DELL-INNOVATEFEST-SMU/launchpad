export default function LoadingSpinner({
  size = "md",
  message = "Loading...",
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-32 w-32",
    lg: "h-48 w-48",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
}
