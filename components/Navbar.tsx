"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Search, FileText } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "All Posts",
      href: "/outreach",
      icon: Database,
      description: "View messages and analytics",
    },
    {
      name: "Voyager Search",
      href: "/search",
      icon: Search,
      description: "Scrape subreddit content",
    },
    {
      name: "Session Notes",
      href: "/case-assistant",
      icon: FileText,
      description: "Write case studies",
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="text-xl font-bold text-black">SAMH Portal</div>

          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-gray-500">SAMH Staff Portal</div>
      </div>
    </nav>
  );
}
