"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/services/auth-context";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FileQuestion,
  User,
  LogOut,
  Menu,
  BarChart3,
  Moon,
  Sun,
  GalleryHorizontalEnd,
} from "lucide-react";
import { useTheme } from "@/app/services/theme-context";
import Image from "next/image";

const sideBarItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    name: "Quizzes",
    href: "/quizzes",
    icon: FileQuestion,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Flashcards",
    href: "/flashcards",
    icon: GalleryHorizontalEnd,
  },
];

export function Sidebar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Don't show sidebar on login page or if not authenticated
  if (!isAuthenticated || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        {" "}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-card shadow-md hover:bg-accent"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-start h-16 px-6 pt-4 bg-primary">
            <Image
              src={
                theme === "dark"
                  ? "/mountainEdlogo-white.png"
                  : "/mountainEdlogo-dark.png"
              }
              alt="MountainEd Logo"
              width={32}
              height={32}
              className="object-contain mr-3"
            />
            <h3 className="text-primary-foreground font-bold text-2xl tracking-wide">
              MountainEd
            </h3>
          </div>

          <div
            className="w-[90%] h-px border-b-2 border-red-800 m-auto py-2"
            aria-hidden="true"
          />
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sideBarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange/80 text-primary border-l-2 border-primary h-10 my-2 rounded-xl"
                      : "text-foreground hover:bg-accent hover:text-primary"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.username || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="flex items-center px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-primary transition-colors"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-3 h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-3 h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </button>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-primary transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
