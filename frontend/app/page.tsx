"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:4000";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function continueAsGuest() {
    if (loading) return;

    try {
      setLoading(true);

      // Clear any old/stale session before creating a new guest session.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      const response = await fetch(`${API_URL}/auth/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        let message = "Guest login failed";

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      // Validate the backend response before saving anything.
      if (!data?.accessToken) {
        throw new Error("Login response did not contain an access token.");
      }

      if (!data?.user) {
        throw new Error("Login response did not contain user information.");
      }

      // Store the new authenticated session.
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Verify that the token was actually stored.
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken) {
        throw new Error("Unable to save authentication session.");
      }

      // Replace the login page instead of adding it to browser history.
      router.replace("/tasks");
    } catch (error) {
      console.error("Guest login error:", error);

      // Make sure a failed login doesn't leave a broken partial session.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      alert(
        error instanceof Error
          ? error.message
          : "Unable to continue as guest.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 text-[#1f1f1f]">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-xl font-semibold text-white">
            P
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Let's get back on track
          </h1>

          <p className="mt-3 text-sm text-[#777]">
            Manage your tasks and projects in one place.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e7e7e4] bg-white p-6 shadow-sm">
          <button
            onClick={continueAsGuest}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#191919] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Continue as Guest"}

            {!loading && <ArrowRight size={17} />}
          </button>

          <button
            disabled
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-[#e5e5e2] bg-white px-4 py-3.5 text-sm font-medium text-[#333] opacity-70"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs leading-5 text-[#888]">
            By continuing, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </div>
    </main>
  );
}