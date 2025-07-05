"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FileQuestion,
  User,
  LogOut,
  Menu,
  BarChart3,
  GalleryHorizontalEnd,
  CalendarCheck,
  Download,
} from "lucide-react";
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
    name: "Exported Quizzes",
    href: "/exported-quizzes",
    icon: Download,
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
  {
    name: "Study Plaanner",
    href: "/studyplanner",
    icon: CalendarCheck,
  },
];

export function Sidebar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [masteryScore, setMasteryScore] = React.useState(0);

  // Fetch mastery score from userprogresslist API
  React.useEffect(() => {
    const fetchMasteryScore = async () => {
      if (isAuthenticated && user) {
        try {
          const userProgressList = await apiService.getUserProgress_list();
          if (userProgressList && userProgressList.length > 0) {
            // Get the latest or average mastery score
            const latestProgress = userProgressList[0];
            setMasteryScore(latestProgress.mastery_score || 0);
          }
        } catch (error) {
          console.error("Failed to fetch mastery score:", error);
          setMasteryScore(0);
        }
      }
    };

    fetchMasteryScore();
  }, [isAuthenticated, user]);

  // Don't show sidebar on login page or if not authenticated
  if (!isAuthenticated || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Fixed top bar with mobile menu button */}
      <div
        className={`lg:hidden ${
          isOpen ? "" : "bg-gray-50"
        } fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-[15%]`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={
            isOpen
              ? "hidden"
              : "p-2 rounded-md bg-orange/90 transition-colors focus:outline-none"
          }
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Add top padding to main content on mobile */}
      <div className="lg:hidden h-14" />

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
              src={"/mountainEdlogo-dark.png"}
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
                      ? "bg-orange/90 text-primary border-l-2 border-primary h-10 my-2 rounded-xl"
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
              <div className="flex flex-row gap-10 align-center justify-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.username || user?.email || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <span className="text-white bg-[#ffd200] w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shadow-lg transform hover:scale-105 transition-transform duration-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#ffd2200] to-[#fff176] rounded-full"></div>
                  <div className="relative z-10 font-bold text-[#2c1810]">
                    {masteryScore}
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-white bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
