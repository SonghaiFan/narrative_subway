"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

// Mock users for quick reference
const DEMO_ACCOUNTS = [
  { name: "Domain Expert", username: "domain", role: "domain" },
  { name: "Text User", username: "text", role: "normal" },
  { name: "Visualization User", username: "viz", role: "normal" },
  { name: "Text Chat User", username: "textchat", role: "normal" },
  { name: "Visualization Chat User", username: "vizchat", role: "normal" },
];

export function LoginForm() {
  const { login, error: authError, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      await login(username, password);
      // If login is successful, the auth context will update and redirect
    } catch (err) {
      // Error is handled by auth context
      console.error("Login error:", err);
    }
  };

  const handleQuickLogin = async (username: string) => {
    setUsername(username);
    setPassword("study");

    try {
      await login(username, "study");
    } catch (err) {
      console.error("Quick login error:", err);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {(error || authError) && (
          <div className="p-2 text-xs bg-red-50 text-red-700 rounded-md">
            {error || authError}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Quick Login (Password: study)
        </p>
        <div className="grid grid-cols-2 gap-1">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              type="button"
              onClick={() => handleQuickLogin(account.username)}
              disabled={isLoading}
              className="text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none"
            >
              {account.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center w-full mt-3">
          Demo application for user study
        </p>
      </div>
    </div>
  );
}
