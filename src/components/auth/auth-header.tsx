"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface AuthHeaderProps {
  title: string;
}

export function AuthHeader({ title }: AuthHeaderProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm z-10 px-4 py-2">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <span className="mr-2">{user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500">
                Signed in as{" "}
                <span className="font-semibold">{user?.username}</span>
              </div>
              <div className="border-t border-gray-100"></div>
              <div className="px-4 py-2 text-xs text-gray-500">
                Role:{" "}
                <span className="font-semibold capitalize">{user?.role}</span>
              </div>

              {/* Navigation Links */}
              <div className="border-t border-gray-100"></div>
              <Link
                href="/"
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                Back
              </Link>

              {/* Logout Button */}
              <div className="border-t border-gray-100"></div>
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
