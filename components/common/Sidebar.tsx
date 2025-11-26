"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Calendar, Image as GalleryIcon, User, Users } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const menu = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Events", href: "/events", icon: Users },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Gallery", href: "/gallery", icon: GalleryIcon },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-58 h-full border-r dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">BraveBoard</h1>

        <nav className="mt-8 flex flex-col gap-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  active
                    ? "bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">John Doe</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
