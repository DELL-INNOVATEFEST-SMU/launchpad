import { adminLogout } from "@/app/actions/admin-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Admin Dashboard Page
 * Protected route that requires admin authentication
 * Authentication is handled by the protected layout
 */
export default async function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome to the SAMH Space Station Admin Panel
              </p>
            </div>
            <form action={adminLogout}>
              <Button
                type="submit"
                variant="destructive"
                className="inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Search Messages
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        <Link
                          href="/search"
                          className="text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          View Search Page →
                        </Link>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Outreach Assistant
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        <Link
                          href="/outreach"
                          className="text-green-600 hover:text-green-500 transition-colors"
                        >
                          View Outreach Page →
                        </Link>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Case Assistant
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        <Link
                          href="/case-assistant"
                          className="text-purple-600 hover:text-purple-500 transition-colors"
                        >
                          View Case Assistant →
                        </Link>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  System Status
                </h3>
                <div className="mt-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Database Connection
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Connected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          API Services
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Operational
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          AI Models
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
