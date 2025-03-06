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
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        <p className="text-gray-600 mt-2">
          Enter your username and password to access the study
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {(error || authError) && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error || authError}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">
            All accounts use password: "study"
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => handleQuickLogin(account.username)}
                disabled={isLoading}
                className="text-sm py-1 px-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login as {account.name}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center w-full mt-4">
          This is a demo application for a user study.
        </p>
      </div>
    </div>
  );
}
